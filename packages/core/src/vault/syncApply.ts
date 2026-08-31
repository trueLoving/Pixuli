import type { ImageItem } from '../types/image';
import type {
  StorageProvider,
  StorageProviderSync,
  SyncPullResult,
  SyncPushItem,
} from '../plugins/types';
import { hasStorageProviderSync } from '../plugins/types';
import type { LocalImageIndexEntry, LocalVault, SyncConflict } from './types';
import { resolveLocalPathForPull, resolveRemotePathForPush } from './syncPath';
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

function isRemoteUpToDate(
  existing: LocalImageIndexEntry,
  remotePath: string,
  remoteUpdatedAt: string,
  meta: Partial<ImageItem>,
): boolean {
  if (existing.syncState !== 'synced') {
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
      isRemoteUpToDate(existing, item.remotePath, remoteUpdatedAt, meta)
    ) {
      continue;
    }

    if (
      existing &&
      !existing.deletedAt &&
      existing.syncState === 'synced' &&
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

export function buildSyncPushItems(
  vault: LocalVault,
  bindingId: string,
  relativePaths: string[],
  readBytes: (relativePath: string) => Promise<Uint8Array>,
): Promise<SyncPushItem[]> {
  return Promise.all(
    relativePaths.map(async relativePath => {
      const entry = await vault.getByPath(relativePath);
      if (!entry) {
        throw new Error(`Missing local entry: ${relativePath}`);
      }
      const remotePath = resolveRemotePathForPush(entry);
      if (!remotePath) {
        throw new Error(`Path is not syncable: ${relativePath}`);
      }
      if (entry.deletedAt) {
        return {
          localRelativePath: relativePath,
          remotePath,
          action: 'delete' as const,
        };
      }
      const bytes = await readBytes(relativePath);
      return {
        localRelativePath: relativePath,
        remotePath,
        action: 'upload' as const,
        file: bytes,
        metadata: {
          name: entry.name,
          tags: entry.tags,
          description: entry.description,
          width: entry.width,
          height: entry.height,
          size: entry.size,
          type: entry.mimeType,
        },
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
