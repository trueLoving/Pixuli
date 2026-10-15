import type { ImageItem } from '../types/image';
import type {
  StorageProvider,
  StorageProviderSync,
  SyncPullResult,
  SyncPushItem,
} from '../plugins/types';
import { hasStorageProviderSync } from '../plugins/types';
import type { LocalImageIndexEntry, LocalVault, SyncConflict } from './types';
import {
  isSyncExcludedPath,
  resolveLocalPathForPull,
  resolveRemotePathForPush,
} from './syncPath';
import { basename, nowIso } from './utils';

export {
  isSyncExcludedPath,
  joinConfigRoot,
  normalizeConfigRoot,
  resolveLocalPathForPull,
  resolveRemotePathForPush,
  SYNC_EXCLUDED_DIR,
} from './syncPath';

export async function downloadRemoteBytes(
  provider: StorageProvider,
  remotePath: string,
  downloadUrl?: string,
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<Uint8Array> {
  const url = downloadUrl || provider.getRawUrl(remotePath);
  const response = await fetchFn(url);
  if (!response.ok) {
    throw new Error(
      `Failed to download remote file ${remotePath}: ${response.status}`,
    );
  }
  return new Uint8Array(await response.arrayBuffer());
}

function pickImageMetadata(metadata?: Partial<ImageItem>): Partial<ImageItem> {
  if (!metadata) {
    return {};
  }
  return {
    name: metadata.name,
    tags: metadata.tags,
    description: metadata.description,
    width: metadata.width,
    height: metadata.height,
    size: metadata.size,
    type: metadata.type,
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt,
  };
}

async function findExistingForPullItem(
  vault: LocalVault,
  bindingId: string,
  remotePath: string,
): Promise<LocalImageIndexEntry | null> {
  const canonicalPath = resolveLocalPathForPull(remotePath);
  const byPath = await vault.getByPath(canonicalPath);
  if (byPath && !byPath.deletedAt) {
    return byPath;
  }

  const boundEntries = await vault.list({ bindingId });
  const fromBound = boundEntries.find(
    entry =>
      !entry.deletedAt &&
      (entry.remotePath === remotePath || entry.relativePath === canonicalPath),
  );
  if (fromBound) {
    return fromBound;
  }

  const unboundEntries = await vault.list();
  return (
    unboundEntries.find(
      entry =>
        !entry.deletedAt &&
        (entry.remotePath === remotePath ||
          entry.relativePath === canonicalPath),
    ) ?? null
  );
}

/** 远端 manifest 未单独存展示名时，listImages 会回退为 basename（含 timestamp 前缀） */
export function resolvePullDisplayName(
  meta: Partial<ImageItem>,
  existing: LocalImageIndexEntry | null | undefined,
  remotePath: string,
): string {
  const remoteBase = basename(remotePath);
  if (meta.name && meta.name !== remoteBase) {
    return meta.name;
  }
  if (existing?.name && existing.name !== remoteBase) {
    return existing.name;
  }
  return meta.name ?? existing?.name ?? remoteBase;
}

function metadataPatchFromPull(
  existing: LocalImageIndexEntry,
  meta: Partial<ImageItem>,
  remotePath: string,
): Partial<LocalImageIndexEntry> | null {
  const patch: Partial<LocalImageIndexEntry> = {};
  const name = resolvePullDisplayName(meta, existing, remotePath);
  if (name !== existing.name) {
    patch.name = name;
  }
  if (
    meta.description !== undefined &&
    meta.description !== existing.description
  ) {
    patch.description = meta.description;
  }
  if (
    meta.tags !== undefined &&
    JSON.stringify(meta.tags) !== JSON.stringify(existing.tags)
  ) {
    patch.tags = meta.tags;
  }
  return Object.keys(patch).length > 0 ? patch : null;
}

function isSyncedToBinding(
  entry: LocalImageIndexEntry,
  bindingId: string,
): boolean {
  return entry.syncState === 'synced' && entry.bindingId === bindingId;
}

function isRemoteUpToDate(
  existing: LocalImageIndexEntry,
  bindingId: string,
  remotePath: string,
  remoteUpdatedAt: string,
  meta: Partial<ImageItem>,
): boolean {
  if (!isSyncedToBinding(existing, bindingId)) {
    return false;
  }
  if (
    existing.remotePath !== remotePath &&
    existing.relativePath !== resolveLocalPathForPull(remotePath)
  ) {
    return false;
  }
  const resolvedName = resolvePullDisplayName(meta, existing, remotePath);
  if (resolvedName !== existing.name) {
    return false;
  }
  if (
    meta.description !== undefined &&
    meta.description !== existing.description
  ) {
    return false;
  }
  if (
    meta.tags !== undefined &&
    JSON.stringify(meta.tags) !== JSON.stringify(existing.tags)
  ) {
    return false;
  }
  if (!remoteUpdatedAt) {
    return true;
  }
  return existing.updatedAt >= remoteUpdatedAt;
}

export async function applySyncPull(
  vault: LocalVault,
  bindingId: string,
  pullResult: SyncPullResult,
  provider: StorageProvider,
  options?: {
    fetchFn?: typeof fetch;
    /** @deprecated 方向性 pull 不再登记冲突，远端始终覆盖本地 */
    onConflict?: (conflict: SyncConflict) => void | Promise<void>;
  },
): Promise<{ pulled: number; conflicts: SyncConflict[] }> {
  const fetchFn = options?.fetchFn ?? globalThis.fetch;
  let pulled = 0;

  for (const item of pullResult.items) {
    const canonicalPath = resolveLocalPathForPull(item.remotePath);
    const existing = await findExistingForPullItem(
      vault,
      bindingId,
      item.remotePath,
    );
    const remoteUpdatedAt = item.metadata?.updatedAt ?? nowIso();

    if (item.action === 'delete') {
      if (existing && !existing.deletedAt) {
        await vault.softDelete(existing.relativePath);
        pulled += 1;
      }
      continue;
    }

    const meta = pickImageMetadata(item.metadata);

    if (
      existing &&
      !existing.deletedAt &&
      isRemoteUpToDate(
        existing,
        bindingId,
        item.remotePath,
        remoteUpdatedAt,
        meta,
      )
    ) {
      continue;
    }

    if (
      existing &&
      !existing.deletedAt &&
      isSyncedToBinding(existing, bindingId) &&
      existing.updatedAt >= remoteUpdatedAt
    ) {
      const patch = metadataPatchFromPull(existing, meta, item.remotePath);
      if (patch) {
        await vault.updateMetadata(existing.relativePath, patch, {
          skipPendingPush: true,
        });
        pulled += 1;
      }
      continue;
    }

    const bytes = await downloadRemoteBytes(
      provider,
      item.remotePath,
      item.metadata?.url,
      fetchFn,
    );

    const previousPath = existing?.relativePath;

    await vault.adapter.writeFile(canonicalPath, bytes);
    await vault.importFile(canonicalPath, canonicalPath, {
      ...meta,
      id: existing?.id,
      name: resolvePullDisplayName(meta, existing, item.remotePath),
      mimeType: meta.type,
      syncState: 'synced',
      remotePath: item.remotePath,
      bindingId,
    });
    await vault.updateSyncMeta(canonicalPath, {
      syncState: 'synced',
      remotePath: item.remotePath,
      bindingId,
    });

    if (previousPath && previousPath !== canonicalPath) {
      await vault.removeEntry(previousPath);
    }

    pulled += 1;
  }

  return { pulled, conflicts: [] };
}

export type SyncPushIntent = 'upload' | 'metadata' | 'delete';

export interface SyncPushPlan {
  relativePath: string;
  intent: SyncPushIntent;
}

const PUSH_INTENT_RANK: Record<SyncPushIntent, number> = {
  metadata: 0,
  upload: 1,
  delete: 2,
};

/** 同一路径多次入队时保留更强的动作：删除 > 上传内容 > 只改元数据。 */
export function mergePushIntent(
  current: SyncPushIntent | undefined,
  next: SyncPushIntent,
): SyncPushIntent {
  if (!current || PUSH_INTENT_RANK[next] > PUSH_INTENT_RANK[current]) {
    return next;
  }
  return current;
}

function normalizeSyncPath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\/+/, '');
}

/**
 * 普通同步只推当前仓库还没有的本地变更。
 * 已同步只对 `entry.bindingId === bindingId` 成立；换仓库后整批上传。
 * 只改过说明/标签、且仍是当前仓库的条目走 metadata，不重传字节。
 */
export function intentFromEntry(
  entry: LocalImageIndexEntry,
  overwriteRemote: boolean,
  bindingId: string,
): SyncPushIntent | null {
  if (isSyncExcludedPath(entry.relativePath)) {
    return null;
  }
  if (entry.deletedAt) {
    if (entry.bindingId && entry.bindingId !== bindingId) {
      return null;
    }
    return entry.remotePath ? 'delete' : null;
  }
  if (overwriteRemote || !isSyncedToBinding(entry, bindingId)) {
    if (
      entry.syncState === 'pending-push' &&
      !overwriteRemote &&
      entry.bindingId === bindingId
    ) {
      if (
        entry.remotePath &&
        normalizeSyncPath(entry.remotePath) ===
          normalizeSyncPath(entry.relativePath)
      ) {
        return 'metadata';
      }
    }
    return 'upload';
  }
  return null;
}

function pushMetadata(entry: LocalImageIndexEntry): SyncPushItem['metadata'] {
  return {
    name: entry.name,
    tags: entry.tags,
    description: entry.description,
    width: entry.width,
    height: entry.height,
    size: entry.size,
    type: entry.mimeType,
  };
}

export function buildSyncPushItems(
  vault: LocalVault,
  bindingId: string,
  plans: SyncPushPlan[],
  readBytes: (relativePath: string) => Promise<Uint8Array>,
): Promise<SyncPushItem[]> {
  void bindingId;
  return Promise.all(
    plans.map(async plan => {
      const { relativePath, intent } = plan;
      const entry = await vault.getByPath(relativePath);
      if (!entry) {
        throw new Error(`Missing local entry: ${relativePath}`);
      }
      const remotePath = resolveRemotePathForPush(entry);
      if (!remotePath) {
        throw new Error(`Path is not syncable: ${relativePath}`);
      }
      if (intent === 'delete' || entry.deletedAt) {
        return {
          localRelativePath: relativePath,
          remotePath,
          action: 'delete' as const,
        };
      }
      if (intent === 'metadata') {
        return {
          localRelativePath: relativePath,
          remotePath,
          action: 'metadata' as const,
          metadata: pushMetadata(entry),
        };
      }
      const bytes = await readBytes(relativePath);
      return {
        localRelativePath: relativePath,
        remotePath,
        action: 'upload' as const,
        file: bytes,
        metadata: pushMetadata(entry),
      };
    }),
  );
}

export function assertSyncProvider(
  provider: StorageProvider,
): StorageProvider & StorageProviderSync {
  if (!hasStorageProviderSync(provider)) {
    throw new Error('Storage provider does not support sync');
  }
  return provider;
}
