import type { ImageItem } from '../types/image';
import type {
  StorageProvider,
  StorageProviderSync,
  SyncPullResult,
  SyncPushItem,
} from '../plugins/types';
import { hasStorageProviderSync } from '../plugins/types';
import type { LocalImageIndexEntry, LocalVault, SyncConflict } from './types';
import { basename, nowIso } from './utils';

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

/** 推送时远端文件名：优先已记录的 remotePath，否则用展示名（与 GitHub upload 的 name 一致） */
export function resolveRemotePathForPush(entry: LocalImageIndexEntry): string {
  return entry.remotePath ?? entry.name ?? basename(entry.relativePath);
}

async function findExistingForPullItem(
  vault: LocalVault,
  bindingId: string,
  remotePath: string,
  canonicalPath: string,
): Promise<LocalImageIndexEntry | null> {
  const byPath = await vault.getByPath(canonicalPath);
  if (byPath && !byPath.deletedAt) {
    return byPath;
  }

  const entries = await vault.list({ bindingId });
  return (
    entries.find(entry => {
      if (entry.deletedAt) {
        return false;
      }
      if (entry.remotePath === remotePath) {
        return true;
      }
      // 兼容：本地 timestamp 路径 + 展示名与远端文件名一致（推送 name 与 remotePath 曾不一致）
      return entry.name === remotePath;
    }) ?? null
  );
}

function isRemoteUpToDate(
  existing: LocalImageIndexEntry,
  remotePath: string,
  remoteUpdatedAt: string,
): boolean {
  if (existing.syncState !== 'synced') {
    return false;
  }
  if (existing.remotePath !== remotePath && existing.name !== remotePath) {
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
    const canonicalPath = `images/${item.remotePath}`;
    const existing = await findExistingForPullItem(
      vault,
      bindingId,
      item.remotePath,
      canonicalPath,
    );
    const remoteUpdatedAt = item.metadata?.updatedAt ?? nowIso();

    if (item.action === 'delete') {
      if (existing && !existing.deletedAt) {
        await vault.softDelete(existing.relativePath);
        pulled += 1;
      }
      continue;
    }

    if (
      existing &&
      !existing.deletedAt &&
      isRemoteUpToDate(existing, item.remotePath, remoteUpdatedAt)
    ) {
      continue;
    }

    const bytes = await downloadRemoteBytes(
      provider,
      item.remotePath,
      item.metadata?.url,
      fetchFn,
    );

    const meta = pickImageMetadata(item.metadata);
    const previousPath = existing?.relativePath;

    await vault.adapter.writeFile(canonicalPath, bytes);
    await vault.importFile(canonicalPath, canonicalPath, {
      ...meta,
      id: existing?.id,
      name: meta.name ?? basename(item.remotePath),
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
