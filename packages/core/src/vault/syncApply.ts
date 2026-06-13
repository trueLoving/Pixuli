import type { ImageItem } from '../types/image';
import type {
  StorageProvider,
  StorageProviderSync,
  SyncPullResult,
  SyncPushItem,
} from '../plugins/types';
import { hasStorageProviderSync } from '../plugins/types';
import type { LocalVault, SyncConflict } from './types';
import { appendConflict } from './syncPersistence';
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

export async function applySyncPull(
  vault: LocalVault,
  bindingId: string,
  pullResult: SyncPullResult,
  provider: StorageProvider,
  options?: {
    fetchFn?: typeof fetch;
    onConflict?: (conflict: SyncConflict) => void | Promise<void>;
  },
): Promise<{ pulled: number; conflicts: SyncConflict[] }> {
  const fetchFn = options?.fetchFn ?? globalThis.fetch;
  const conflicts: SyncConflict[] = [];
  let pulled = 0;

  for (const item of pullResult.items) {
    const localRelativePath = `images/${item.remotePath}`;
    const existing = await vault.getByPath(localRelativePath);
    const remoteUpdatedAt = item.metadata?.updatedAt ?? nowIso();

    if (item.action === 'delete') {
      if (existing && !existing.deletedAt) {
        if (
          existing.syncState === 'pending-push' ||
          existing.syncState === 'local-only'
        ) {
          const conflict: SyncConflict = {
            relativePath: localRelativePath,
            bindingId,
            localRev: existing.updatedAt,
            remoteRev: remoteUpdatedAt,
            strategy: 'lww',
            message: '远端已删除，本地仍有未推送修改',
            recordedAt: nowIso(),
          };
          conflicts.push(conflict);
          await appendConflict(vault.adapter, conflict);
          await options?.onConflict?.(conflict);
          continue;
        }
        await vault.softDelete(localRelativePath);
        pulled += 1;
      }
      continue;
    }

    if (existing && !existing.deletedAt) {
      const sameRemote =
        existing.remotePath === item.remotePath &&
        item.contentHash &&
        existing.id === item.contentHash;
      if (sameRemote && existing.syncState === 'synced') {
        continue;
      }

      if (
        (existing.syncState === 'pending-push' ||
          existing.syncState === 'local-only') &&
        existing.updatedAt > remoteUpdatedAt
      ) {
        const conflict: SyncConflict = {
          relativePath: localRelativePath,
          bindingId,
          localRev: existing.updatedAt,
          remoteRev: remoteUpdatedAt,
          strategy: 'lww',
          message: '本地修改较新，跳过远端覆盖',
          recordedAt: nowIso(),
        };
        conflicts.push(conflict);
        await appendConflict(vault.adapter, conflict);
        await options?.onConflict?.(conflict);
        continue;
      }
    }

    const bytes = await downloadRemoteBytes(
      provider,
      item.remotePath,
      item.metadata?.url,
      fetchFn,
    );

    const meta = pickImageMetadata(item.metadata);
    await vault.adapter.writeFile(localRelativePath, bytes);
    await vault.importFile(localRelativePath, localRelativePath, {
      ...meta,
      name: meta.name ?? basename(item.remotePath),
      mimeType: meta.type,
      syncState: 'synced',
      remotePath: item.remotePath,
      bindingId,
    });
    await vault.updateSyncMeta(localRelativePath, {
      syncState: 'synced',
      remotePath: item.remotePath,
      bindingId,
    });
    pulled += 1;
  }

  return { pulled, conflicts };
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
      if (entry.deletedAt) {
        return {
          localRelativePath: relativePath,
          remotePath: entry.remotePath ?? basename(relativePath),
          action: 'delete' as const,
        };
      }
      const bytes = await readBytes(relativePath);
      return {
        localRelativePath: relativePath,
        remotePath: entry.remotePath ?? basename(relativePath),
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
