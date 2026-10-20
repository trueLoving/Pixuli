import type {
  RemoteSyncTreeFile,
  StorageProvider,
  StorageProviderSync,
} from '../plugins/types';
import { hasStorageProviderSync } from '../plugins/types';
import {
  appendPushQueue,
  clearFolderDirty,
  getBindingSyncState,
  markFoldersDirty,
  readConflicts,
  readPushQueue,
  updateBindingSyncState,
  writePushQueue,
  type BindingSyncStateRecord,
  type QueuedPushOperation,
} from './syncPersistence';
import {
  applySyncPull,
  assertSyncProvider,
  buildSyncPushItems,
  intentFromEntry,
  mergePushIntent,
  type SyncPushIntent,
} from './syncApply';
import { isSyncExcludedPath } from './syncPath';
import {
  buildSyncTreeFromPaths,
  createEmptySyncTree,
  folderKeyFromFilePath,
  listDirtyFolderKeys,
  normalizeFolderKey,
  parseSyncTree,
  touchFolderInTree,
  type SyncTreeFile,
} from './syncTree';
import type {
  LocalImageIndexEntry,
  LocalVault,
  SyncEngine,
  SyncPushOperation,
  SyncRunOptions,
  SyncRunResult,
  SyncStatusSummary,
} from './types';
import { nowIso } from './utils';

export interface SyncEngineBinding {
  bindingId: string;
  provider: StorageProvider;
  configRoot?: string;
}

export interface CreateSyncEngineOptions {
  vault: LocalVault;
  getBindings: () => SyncEngineBinding[];
  readFileBytes?: (relativePath: string) => Promise<Uint8Array>;
  fetch?: typeof fetch;
  onEnqueue?: (op: SyncPushOperation) => void | Promise<void>;
}

/**
 * SyncEngine：文件夹协商缓存同步。
 * 先拉 sync-tree 比对 revision；未变跳过；脏夹进目录再拉文件。
 * `.pixuli` 仅本机；远端只写 sync-tree + 各层 manifest。
 */
export function createSyncEngine(options: CreateSyncEngineOptions): SyncEngine {
  const {
    vault,
    getBindings,
    readFileBytes = relativePath => vault.adapter.readFile(relativePath),
    fetch: fetchFn = globalThis.fetch,
    onEnqueue,
  } = options;

  const memoryQueue: SyncPushOperation[] = [];

  const resolveBinding = (bindingId?: string): SyncEngineBinding => {
    const bindings = getBindings();
    if (bindings.length === 0) {
      throw new Error('No sync bindings configured');
    }
    if (bindingId) {
      const found = bindings.find(item => item.bindingId === bindingId);
      if (!found) {
        throw new Error(`Sync binding not found: ${bindingId}`);
      }
      return found;
    }
    return bindings[0];
  };

  const emptyResult = (): SyncRunResult => ({
    pushed: 0,
    pulled: 0,
    conflicts: [],
    errors: [],
  });

  async function pullFolderLayer(
    binding: SyncEngineBinding,
    provider: StorageProvider & StorageProviderSync,
    folderKey: string,
    remoteRevision: string | null,
  ): Promise<{ pulled: number; conflicts: SyncRunResult['conflicts'] }> {
    const pullResult = await provider.syncPull({
      pathPrefix: folderKey,
      shallow: true,
    });
    await ensureLocalFolders(vault, [
      ...(pullResult.folderKeys ?? []),
      folderKey,
    ]);
    const applied = await applySyncPull(
      vault,
      binding.bindingId,
      pullResult,
      provider,
      { fetchFn },
    );
    const stampRevision = remoteRevision ?? pullResult.nextCursor ?? nowIso();
    await clearFolderDirty(
      vault.adapter,
      binding.bindingId,
      folderKey,
      stampRevision,
    );
    return applied;
  }

  async function negotiatePull(
    binding: SyncEngineBinding,
    provider: StorageProvider & StorageProviderSync,
    pathPrefix?: string,
  ): Promise<SyncRunResult> {
    const result = emptyResult();
    const bindingState = await getBindingSyncState(
      vault.adapter,
      binding.bindingId,
    );
    const immediateKey = normalizeFolderKey(pathPrefix ?? '');

    const remoteTree = await fetchRemoteSyncTree(provider);
    if (!remoteTree) {
      return legacyFullPull(binding, provider, bindingState, result);
    }

    const dirty = listDirtyFolderKeys(
      remoteTree,
      bindingState.folders,
      bindingState.treeRevision,
    );

    await ensureLocalFolders(vault, Object.keys(remoteTree.folders));

    if (dirty.length === 0) {
      await updateBindingSyncState(vault.adapter, binding.bindingId, {
        cursor: remoteTree.revision,
        treeRevision: remoteTree.revision,
        lastSyncAt: nowIso(),
      });
      return {
        ...result,
        skipped: true,
        dirtyFolders: [],
      };
    }

    await markFoldersDirty(
      vault.adapter,
      binding.bindingId,
      dirty,
      remoteTree.revision,
    );

    const remaining = dirty.filter(key => key !== immediateKey);
    if (dirty.includes(immediateKey)) {
      const folderRev = remoteTree.folders[immediateKey]?.revision ?? null;
      const applied = await pullFolderLayer(
        binding,
        provider,
        immediateKey,
        folderRev,
      );
      result.pulled += applied.pulled;
      result.conflicts.push(...applied.conflicts);
    }

    await updateBindingSyncState(vault.adapter, binding.bindingId, {
      cursor: remoteTree.revision,
      treeRevision: remoteTree.revision,
      lastSyncAt: nowIso(),
    });

    result.dirtyFolders = remaining;
    return result;
  }

  async function legacyFullPull(
    binding: SyncEngineBinding,
    provider: StorageProvider & StorageProviderSync,
    bindingState: BindingSyncStateRecord,
    result: SyncRunResult,
  ): Promise<SyncRunResult> {
    const pullResult = await provider.syncPull({
      since: bindingState.cursor ?? undefined,
    });
    const applied = await applySyncPull(
      vault,
      binding.bindingId,
      pullResult,
      provider,
      { fetchFn },
    );
    result.pulled += applied.pulled;
    result.conflicts.push(...applied.conflicts);

    const tree = buildSyncTreeFromPaths(
      pullResult.items.map(item => item.remotePath),
      pullResult.folderKeys ?? [],
    );
    if (typeof provider.writeSyncTree === 'function') {
      try {
        await provider.writeSyncTree(toRemoteTree(tree));
      } catch {
        // 旧仓无写权限时忽略；本地仍记 stamp
      }
    }
    await updateBindingSyncState(vault.adapter, binding.bindingId, {
      cursor: pullResult.nextCursor ?? tree.revision,
      treeRevision: tree.revision,
      lastSyncAt: nowIso(),
      folders: Object.fromEntries(
        Object.entries(tree.folders).map(([key, stamp]) => [
          key,
          { revision: stamp.revision, dirty: false },
        ]),
      ),
    });
    return result;
  }

  async function pushWithTree(
    binding: SyncEngineBinding,
    provider: StorageProvider & StorageProviderSync,
    overwriteRemote: boolean,
  ): Promise<number> {
    const beforeEntries = await vault.list({ includeDeleted: true });
    const pendingFolders = new Set<string>();
    for (const entry of beforeEntries) {
      if (intentFromEntry(entry, overwriteRemote, binding.bindingId)) {
        pendingFolders.add(folderKeyFromFilePath(entry.relativePath));
      }
    }
    const queue = await readPushQueue(vault.adapter);
    for (const op of queue) {
      pendingFolders.add(folderKeyFromFilePath(op.relativePath));
    }
    for (const op of memoryQueue) {
      pendingFolders.add(folderKeyFromFilePath(op.relativePath));
    }

    if (pendingFolders.size === 0 && !overwriteRemote) {
      return 0;
    }

    const pushed = await flushPushQueue(
      vault,
      binding,
      provider,
      readFileBytes,
      memoryQueue,
      { overwriteRemote },
    );

    if (pushed === 0 && !overwriteRemote) {
      return 0;
    }

    const at = nowIso();
    let tree = (await fetchRemoteSyncTree(provider)) ?? createEmptySyncTree(at);
    const entries = await vault.list({ includeDeleted: true });
    const localFolders = await vault.listFolders();
    if (overwriteRemote || !tree.folders['']) {
      tree = buildSyncTreeFromPaths(
        entries.filter(e => !e.deletedAt).map(e => e.relativePath),
        localFolders,
        at,
      );
    } else {
      for (const key of pendingFolders) {
        tree = touchFolderInTree(tree, key, at);
      }
      for (const key of localFolders) {
        if (!tree.folders[normalizeFolderKey(key)]) {
          tree = touchFolderInTree(tree, key, at);
        }
      }
    }

    if (typeof provider.writeSyncTree === 'function') {
      await provider.writeSyncTree(toRemoteTree(tree));
    }

    const folders: BindingSyncStateRecord['folders'] = {
      ...(await getBindingSyncState(vault.adapter, binding.bindingId)).folders,
    };
    for (const [key, stamp] of Object.entries(tree.folders)) {
      if (pendingFolders.has(key) || overwriteRemote) {
        folders[key] = { revision: stamp.revision, dirty: false };
      }
    }
    await updateBindingSyncState(vault.adapter, binding.bindingId, {
      cursor: tree.revision,
      treeRevision: tree.revision,
      lastSyncAt: at,
      folders,
    });

    return pushed;
  }

  return {
    async enqueuePush(op) {
      memoryQueue.push(op);
      await appendPushQueue(vault.adapter, op);
      await onEnqueue?.(op);
    },

    async getStatus(focusBindingId?: string): Promise<SyncStatusSummary> {
      const bindings = getBindings();
      const stateBindings: SyncStatusSummary['bindings'] = {};
      let lastSyncAt: string | null = null;
      const entries = await vault.list({ includeDeleted: true });
      const queue = await readPushQueue(vault.adapter);
      const fallbackBindingId = focusBindingId ?? bindings[0]?.bindingId ?? '';

      for (const binding of bindings) {
        const record = await getBindingSyncState(
          vault.adapter,
          binding.bindingId,
        );
        const dirtyFolders = Object.entries(record.folders)
          .filter(([, stamp]) => stamp.dirty)
          .map(([key]) => key)
          .sort();
        stateBindings[binding.bindingId] = {
          cursor: record.cursor,
          lastSyncAt: record.lastSyncAt,
          pendingPush: pendingPathsForBinding(
            entries,
            queue,
            binding.bindingId,
            fallbackBindingId,
          ).size,
          treeRevision: record.treeRevision,
          dirtyFolders,
        };
        if (
          record.lastSyncAt &&
          (!lastSyncAt || record.lastSyncAt > lastSyncAt)
        ) {
          lastSyncAt = record.lastSyncAt;
        }
      }

      const conflicts = await readConflicts(vault.adapter);
      const pendingPush = focusBindingId
        ? (stateBindings[focusBindingId]?.pendingPush ??
          pendingPathsForBinding(entries, queue, focusBindingId, focusBindingId)
            .size)
        : new Set(
            bindings.flatMap(binding => [
              ...pendingPathsForBinding(
                entries,
                queue,
                binding.bindingId,
                fallbackBindingId,
              ),
            ]),
          ).size;

      return {
        lastSyncAt,
        pendingPush,
        conflicts: conflicts.length,
        bindings: stateBindings,
      };
    },

    async listDirtyFolders(bindingId?: string): Promise<string[]> {
      const binding = resolveBinding(bindingId);
      const record = await getBindingSyncState(
        vault.adapter,
        binding.bindingId,
      );
      return Object.entries(record.folders)
        .filter(([, stamp]) => stamp.dirty)
        .map(([key]) => key)
        .sort();
    },

    async syncFolder(
      folderPath: string,
      folderOptions?: { bindingId?: string; direction?: 'pull' | 'push' },
    ): Promise<SyncRunResult> {
      const direction = folderOptions?.direction ?? 'pull';
      const binding = resolveBinding(folderOptions?.bindingId);
      const provider = assertSyncProvider(binding.provider);
      const result = emptyResult();
      const folderKey = normalizeFolderKey(folderPath);

      if (direction === 'push') {
        try {
          result.pushed += await pushWithTree(binding, provider, false);
        } catch (error) {
          result.errors.push({
            path: folderKey || 'push',
            message: error instanceof Error ? error.message : 'Push failed',
          });
        }
        return result;
      }

      try {
        const bindingState = await getBindingSyncState(
          vault.adapter,
          binding.bindingId,
        );
        const stamp = bindingState.folders[folderKey];
        if (stamp && !stamp.dirty) {
          return { ...result, skipped: true, dirtyFolders: [] };
        }

        const remoteTree = await fetchRemoteSyncTree(provider);
        const folderRev = remoteTree?.folders[folderKey]?.revision ?? null;
        const applied = await pullFolderLayer(
          binding,
          provider,
          folderKey,
          folderRev,
        );
        result.pulled += applied.pulled;
        result.conflicts.push(...applied.conflicts);
        if (remoteTree) {
          await updateBindingSyncState(vault.adapter, binding.bindingId, {
            cursor: remoteTree.revision,
            treeRevision: remoteTree.revision,
            lastSyncAt: nowIso(),
          });
        } else {
          await updateBindingSyncState(vault.adapter, binding.bindingId, {
            lastSyncAt: nowIso(),
          });
        }
        result.dirtyFolders = await listDirtyFoldersRemaining(
          vault,
          binding.bindingId,
        );
      } catch (error) {
        result.errors.push({
          path: folderKey || 'pull',
          message: error instanceof Error ? error.message : 'Pull failed',
        });
      }
      return result;
    },

    async run(runOptions?: SyncRunOptions): Promise<SyncRunResult> {
      const direction = runOptions?.direction ?? 'both';
      const binding = resolveBinding(runOptions?.bindingId);
      const provider = assertSyncProvider(binding.provider);
      const result = emptyResult();

      if (direction === 'push' || direction === 'both') {
        try {
          result.pushed += await pushWithTree(
            binding,
            provider,
            runOptions?.overwriteRemote === true,
          );
        } catch (error) {
          result.errors.push({
            path: 'push',
            message: error instanceof Error ? error.message : 'Push failed',
          });
        }
      }

      if (direction === 'pull' || direction === 'both') {
        try {
          const negotiated = await negotiatePull(
            binding,
            provider,
            runOptions?.pathPrefix,
          );
          result.pulled += negotiated.pulled;
          result.conflicts.push(...negotiated.conflicts);
          result.dirtyFolders = negotiated.dirtyFolders;
          result.skipped = negotiated.skipped;
          result.errors.push(...negotiated.errors);
        } catch (error) {
          result.errors.push({
            path: 'pull',
            message: error instanceof Error ? error.message : 'Pull failed',
          });
        }
      }

      if (result.errors.length === 0) {
        await updateBindingSyncState(vault.adapter, binding.bindingId, {
          lastSyncAt: nowIso(),
        });
      }

      return result;
    },
  };
}

async function fetchRemoteSyncTree(
  provider: StorageProvider & StorageProviderSync,
): Promise<SyncTreeFile | null> {
  if (typeof provider.readSyncTree !== 'function') {
    return null;
  }
  const raw = await provider.readSyncTree();
  return parseSyncTree(raw);
}

function toRemoteTree(tree: SyncTreeFile): RemoteSyncTreeFile {
  return {
    version: 1,
    revision: tree.revision,
    updatedAt: tree.updatedAt,
    folders: tree.folders,
  };
}

async function ensureLocalFolders(
  vault: LocalVault,
  folderKeys: string[],
): Promise<void> {
  const existing = new Set(await vault.listFolders());
  for (const key of folderKeys) {
    const normalized = normalizeFolderKey(key);
    if (!normalized || existing.has(normalized)) {
      continue;
    }
    await vault.createFolder(normalized);
    existing.add(normalized);
  }
}

async function listDirtyFoldersRemaining(
  vault: LocalVault,
  bindingId: string,
): Promise<string[]> {
  const record = await getBindingSyncState(vault.adapter, bindingId);
  return Object.entries(record.folders)
    .filter(([, stamp]) => stamp.dirty)
    .map(([key]) => key)
    .sort();
}

async function flushPushQueue(
  vault: LocalVault,
  binding: SyncEngineBinding,
  provider: StorageProvider & StorageProviderSync,
  readFileBytes: (relativePath: string) => Promise<Uint8Array>,
  memoryQueue: SyncPushOperation[],
  options?: { overwriteRemote?: boolean },
): Promise<number> {
  const persisted = await readPushQueue(vault.adapter);
  const entries = await vault.list({ includeDeleted: true });
  const activeQueue: QueuedPushOperation[] = [];
  const keptQueue: QueuedPushOperation[] = [];
  for (const op of persisted) {
    const entry = entries.find(item => item.relativePath === op.relativePath);
    const owner = queuedBindingId(op, entry, binding.bindingId);
    if (owner === binding.bindingId) {
      activeQueue.push(op);
    } else {
      keptQueue.push({ ...op, bindingId: owner });
    }
  }
  const queue = [...activeQueue];
  for (const op of memoryQueue) {
    const entry = entries.find(item => item.relativePath === op.relativePath);
    const queued = { ...op, enqueuedAt: nowIso() };
    if (
      queuedBindingId(queued, entry, binding.bindingId) === binding.bindingId
    ) {
      queue.push(queued);
    }
  }
  const overwriteRemote = options?.overwriteRemote === true;
  const intents = new Map<string, SyncPushIntent>();

  for (const entry of entries) {
    if (entry.deletedAt && !entry.remotePath) {
      await vault.removeEntry(entry.relativePath);
      continue;
    }
    const intent = intentFromEntry(entry, overwriteRemote, binding.bindingId);
    if (!intent) {
      continue;
    }
    intents.set(
      entry.relativePath,
      mergePushIntent(intents.get(entry.relativePath), intent),
    );
  }
  for (const op of queue) {
    const entry = await vault.getByPath(op.relativePath);
    if (!entry || isSyncExcludedPath(entry.relativePath)) {
      continue;
    }
    if (entry.deletedAt && !entry.remotePath) {
      await vault.removeEntry(op.relativePath);
      continue;
    }
    const queuedIntent: SyncPushIntent =
      op.type === 'delete'
        ? 'delete'
        : op.type === 'metadata' && !overwriteRemote
          ? 'metadata'
          : 'upload';
    intents.set(
      entry.relativePath,
      mergePushIntent(intents.get(entry.relativePath), queuedIntent),
    );
  }

  if (intents.size === 0) {
    await writePushQueue(vault.adapter, keptQueue);
    memoryQueue.length = 0;
    return 0;
  }

  const built = await buildSyncPushItems(
    vault,
    binding.bindingId,
    [...intents.entries()].map(([relativePath, intent]) => ({
      relativePath,
      intent,
    })),
    readFileBytes,
  );

  const items: Awaited<ReturnType<typeof buildSyncPushItems>> = [];
  for (const item of built) {
    if (item.action === 'delete') {
      const entry = await vault.getByPath(item.localRelativePath);
      if (!entry?.remotePath) {
        if (entry) {
          await vault.removeEntry(item.localRelativePath);
        }
        continue;
      }
    }
    items.push(item);
  }

  if (items.length === 0) {
    await writePushQueue(vault.adapter, keptQueue);
    memoryQueue.length = 0;
    return 0;
  }

  await provider.syncPush(items);

  let pushed = 0;
  for (const item of items) {
    if (item.action === 'delete') {
      await vault.removeEntry(item.localRelativePath);
      pushed += 1;
      continue;
    }

    await vault.updateSyncMeta(item.localRelativePath, {
      syncState: 'synced',
      remotePath: item.remotePath,
      bindingId: binding.bindingId,
    });
    pushed += 1;
  }

  await writePushQueue(vault.adapter, keptQueue);
  memoryQueue.length = 0;
  return pushed;
}

function queuedBindingId(
  op: QueuedPushOperation,
  entry: LocalImageIndexEntry | undefined,
  fallbackBindingId: string,
): string {
  return op.bindingId || entry?.bindingId || fallbackBindingId;
}

function pendingPathsForBinding(
  entries: LocalImageIndexEntry[],
  queue: QueuedPushOperation[],
  bindingId: string,
  fallbackBindingId: string,
): Set<string> {
  const paths = new Set<string>();
  for (const entry of entries) {
    if (entry.deletedAt && !entry.remotePath) {
      continue;
    }
    if (intentFromEntry(entry, false, bindingId)) {
      paths.add(entry.relativePath);
    }
  }
  for (const op of queue) {
    const entry = entries.find(item => item.relativePath === op.relativePath);
    if (queuedBindingId(op, entry, fallbackBindingId) === bindingId) {
      paths.add(op.relativePath);
    }
  }
  return paths;
}

export function providerSupportsSync(
  provider: StorageProvider,
): provider is StorageProvider & StorageProviderSync {
  return hasStorageProviderSync(provider);
}
