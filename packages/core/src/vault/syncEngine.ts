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
  writeConflicts,
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
  resolveLocalPathForPull,
  type SyncPushIntent,
} from './syncApply';
import { readSyncIgnorePatterns } from './syncIgnore';
import { isSyncExcludedPath, isUserSyncIgnored } from './syncPath';
import {
  buildSyncTreeFromPaths,
  createEmptySyncTree,
  folderKeyAndAncestors,
  folderKeyFromFilePath,
  listDirtyFolderKeys,
  normalizeFolderKey,
  parseSyncTree,
  touchFolderInTree,
  type SyncTreeFile,
} from './syncTree';
import type {
  LocalAssetIndexEntry,
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
    layerOptions?: { overwriteLocal?: boolean; ignorePatterns?: string[] },
  ): Promise<{
    pulled: number;
    conflicts: SyncRunResult['conflicts'];
    remotePaths: string[];
  }> {
    const pullResult = await provider.syncPull({
      pathPrefix: folderKey,
      shallow: true,
    });
    const discovered = [...(pullResult.folderKeys ?? []), folderKey].map(
      normalizeFolderKey,
    );
    await ensureLocalFolders(vault, discovered);
    const applied = await applySyncPull(
      vault,
      binding.bindingId,
      pullResult,
      provider,
      {
        fetchFn,
        overwriteLocal: layerOptions?.overwriteLocal === true,
        ignorePatterns: layerOptions?.ignorePatterns,
      },
    );
    const stampRevision = remoteRevision ?? pullResult.nextCursor ?? nowIso();
    await clearFolderDirty(
      vault.adapter,
      binding.bindingId,
      folderKey,
      stampRevision,
    );
    const state = await getBindingSyncState(vault.adapter, binding.bindingId);
    const unmarkedChildren = discovered.filter(key => {
      if (!key || key === folderKey) {
        return false;
      }
      const stamp = state.folders[key];
      return !stamp || stamp.dirty || !stamp.revision;
    });
    if (unmarkedChildren.length > 0) {
      await markFoldersDirty(
        vault.adapter,
        binding.bindingId,
        unmarkedChildren,
      );
    }
    const remotePaths = pullResult.items
      .filter(item => item.action !== 'delete')
      .map(item => resolveLocalPathForPull(item.remotePath));
    return { ...applied, remotePaths };
  }

  async function negotiatePull(
    binding: SyncEngineBinding,
    provider: StorageProvider & StorageProviderSync,
    pathPrefix?: string,
  ): Promise<SyncRunResult> {
    const result = emptyResult();
    const ignorePatterns = await readSyncIgnorePatterns(vault.adapter);
    const bindingState = await getBindingSyncState(
      vault.adapter,
      binding.bindingId,
    );
    const immediateKey = normalizeFolderKey(pathPrefix ?? '');

    const remoteTree = await fetchRemoteSyncTree(provider);
    if (!remoteTree) {
      return legacyFullPull(
        binding,
        provider,
        bindingState,
        result,
        ignorePatterns,
      );
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

    const localFiles = await vault.list();
    if (localFiles.length === 0) {
      const pending = new Set(dirty);
      const pulledKeys = new Set<string>();
      while (pending.size > 0) {
        const key = [...pending].sort()[0] ?? '';
        pending.delete(key);
        if (pulledKeys.has(key)) {
          continue;
        }
        pulledKeys.add(key);
        const folderRev = remoteTree.folders[key]?.revision ?? null;
        const applied = await pullFolderLayer(
          binding,
          provider,
          key,
          folderRev,
          { ignorePatterns },
        );
        result.pulled += applied.pulled;
        result.conflicts.push(...applied.conflicts);
        const still = await listDirtyFoldersRemaining(vault, binding.bindingId);
        for (const next of still) {
          if (!pulledKeys.has(next)) {
            pending.add(next);
          }
        }
      }
    } else if (dirty.includes(immediateKey)) {
      const folderRev = remoteTree.folders[immediateKey]?.revision ?? null;
      const applied = await pullFolderLayer(
        binding,
        provider,
        immediateKey,
        folderRev,
        { ignorePatterns },
      );
      result.pulled += applied.pulled;
      result.conflicts.push(...applied.conflicts);
    }

    await updateBindingSyncState(vault.adapter, binding.bindingId, {
      cursor: remoteTree.revision,
      treeRevision: remoteTree.revision,
      lastSyncAt: nowIso(),
    });

    result.dirtyFolders = await listDirtyFoldersRemaining(
      vault,
      binding.bindingId,
    );
    return result;
  }

  async function legacyFullPull(
    binding: SyncEngineBinding,
    provider: StorageProvider & StorageProviderSync,
    bindingState: BindingSyncStateRecord,
    result: SyncRunResult,
    ignorePatterns: string[] = [],
  ): Promise<SyncRunResult> {
    const pullResult = await provider.syncPull({
      since: bindingState.cursor ?? undefined,
    });
    const applied = await applySyncPull(
      vault,
      binding.bindingId,
      pullResult,
      provider,
      { fetchFn, ignorePatterns },
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
    ignorePatterns?: string[],
  ): Promise<number> {
    const patterns =
      ignorePatterns ?? (await readSyncIgnorePatterns(vault.adapter));
    const beforeEntries = await vault.list({ includeDeleted: true });
    const pendingFolders = new Set<string>();
    const rememberPending = (relativePath: string) => {
      for (const key of folderKeyAndAncestors(
        folderKeyFromFilePath(relativePath),
      )) {
        pendingFolders.add(key);
      }
    };
    for (const entry of beforeEntries) {
      if (
        intentFromEntry(entry, overwriteRemote, binding.bindingId, {
          ignorePatterns: patterns,
        })
      ) {
        rememberPending(entry.relativePath);
      }
    }
    const queue = await readPushQueue(vault.adapter);
    for (const op of queue) {
      if (!isUserSyncIgnored(op.relativePath, patterns)) {
        rememberPending(op.relativePath);
      }
    }
    for (const op of memoryQueue) {
      if (!isUserSyncIgnored(op.relativePath, patterns)) {
        rememberPending(op.relativePath);
      }
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
      { overwriteRemote, ignorePatterns: patterns },
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
        const normalized = normalizeFolderKey(key);
        if (!tree.folders[normalized]) {
          for (const ancestor of folderKeyAndAncestors(normalized)) {
            pendingFolders.add(ancestor);
          }
          tree = touchFolderInTree(tree, normalized, at);
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
      const patterns = await readSyncIgnorePatterns(vault.adapter);
      if (
        isSyncExcludedPath(op.relativePath) ||
        isUserSyncIgnored(op.relativePath, patterns)
      ) {
        return;
      }
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
      const ignorePatterns = await readSyncIgnorePatterns(vault.adapter);
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
            ignorePatterns,
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
          pendingPathsForBinding(
            entries,
            queue,
            focusBindingId,
            focusBindingId,
            ignorePatterns,
          ).size)
        : new Set(
            bindings.flatMap(binding => [
              ...pendingPathsForBinding(
                entries,
                queue,
                binding.bindingId,
                fallbackBindingId,
                ignorePatterns,
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
      const ignorePatterns = await readSyncIgnorePatterns(vault.adapter);

      if (direction === 'push') {
        try {
          result.pushed += await pushWithTree(
            binding,
            provider,
            false,
            ignorePatterns,
          );
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
          { ignorePatterns },
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
      const ignorePatterns = await readSyncIgnorePatterns(vault.adapter);

      if (direction === 'push' || direction === 'both') {
        try {
          const remoteTree = await fetchRemoteSyncTree(provider);
          const localState = await getBindingSyncState(
            vault.adapter,
            binding.bindingId,
          );
          if (
            remoteTree &&
            localState.treeRevision &&
            remoteTree.revision !== localState.treeRevision
          ) {
            result.remoteAhead = true;
            result.errors.push({
              path: 'push',
              message: 'Remote has changed since last sync; pull first',
            });
            return result;
          }
          result.pushed += await pushWithTree(
            binding,
            provider,
            runOptions?.overwriteRemote === true,
            ignorePatterns,
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

    async resetToRemote(resetOptions?: {
      bindingId?: string;
    }): Promise<SyncRunResult> {
      const binding = resolveBinding(resetOptions?.bindingId);
      const provider = assertSyncProvider(binding.provider);
      const result = emptyResult();
      result.removed = 0;

      await updateBindingSyncState(vault.adapter, binding.bindingId, {
        cursor: null,
        treeRevision: null,
        folders: {},
      });

      const softDeleted = await vault.list({ includeDeleted: true });
      for (const entry of softDeleted) {
        if (entry.deletedAt) {
          await vault.removeEntry(entry.relativePath);
        }
      }

      const remotePaths = new Set<string>();
      const remoteFolders = new Set<string>();
      const ignorePatterns = await readSyncIgnorePatterns(vault.adapter);

      try {
        const remoteTree = await fetchRemoteSyncTree(provider);
        if (!remoteTree) {
          const pullResult = await provider.syncPull({});
          const applied = await applySyncPull(
            vault,
            binding.bindingId,
            pullResult,
            provider,
            { fetchFn, overwriteLocal: true, ignorePatterns },
          );
          result.pulled += applied.pulled;
          result.conflicts.push(...applied.conflicts);
          for (const item of pullResult.items) {
            if (item.action === 'delete') continue;
            remotePaths.add(resolveLocalPathForPull(item.remotePath));
          }
          for (const key of pullResult.folderKeys ?? []) {
            remoteFolders.add(normalizeFolderKey(key));
          }
          const tree = buildSyncTreeFromPaths(
            pullResult.items.map(item => item.remotePath),
            pullResult.folderKeys ?? [],
          );
          if (typeof provider.writeSyncTree === 'function') {
            try {
              await provider.writeSyncTree(toRemoteTree(tree));
            } catch {
              // 旧仓无写权限时忽略
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
        } else {
          const dirty = listDirtyFolderKeys(remoteTree, {}, null);
          await ensureLocalFolders(vault, Object.keys(remoteTree.folders));
          for (const key of Object.keys(remoteTree.folders)) {
            remoteFolders.add(normalizeFolderKey(key));
          }
          await markFoldersDirty(
            vault.adapter,
            binding.bindingId,
            dirty.length > 0 ? dirty : Object.keys(remoteTree.folders),
            remoteTree.revision,
          );

          const pending = new Set(
            dirty.length > 0 ? dirty : Object.keys(remoteTree.folders),
          );
          if (pending.size === 0) {
            pending.add('');
          }
          const pulledKeys = new Set<string>();
          while (pending.size > 0) {
            const key = [...pending].sort()[0] ?? '';
            pending.delete(key);
            if (pulledKeys.has(key)) {
              continue;
            }
            pulledKeys.add(key);
            const folderRev = remoteTree.folders[key]?.revision ?? null;
            const applied = await pullFolderLayer(
              binding,
              provider,
              key,
              folderRev,
              { overwriteLocal: true, ignorePatterns },
            );
            result.pulled += applied.pulled;
            result.conflicts.push(...applied.conflicts);
            for (const path of applied.remotePaths) {
              remotePaths.add(path);
            }
            const still = await listDirtyFoldersRemaining(
              vault,
              binding.bindingId,
            );
            for (const next of still) {
              if (!pulledKeys.has(next)) {
                pending.add(next);
              }
            }
          }

          await updateBindingSyncState(vault.adapter, binding.bindingId, {
            cursor: remoteTree.revision,
            treeRevision: remoteTree.revision,
            lastSyncAt: nowIso(),
          });
        }
      } catch (error) {
        result.errors.push({
          path: 'reset',
          message:
            error instanceof Error ? error.message : 'Reset to remote failed',
        });
        return result;
      }

      const localEntries = await vault.list({ includeDeleted: true });
      for (const entry of localEntries) {
        if (remotePaths.has(entry.relativePath)) {
          continue;
        }
        if (
          entry.remotePath &&
          remotePaths.has(resolveLocalPathForPull(entry.remotePath))
        ) {
          continue;
        }
        await vault.removeEntry(entry.relativePath);
        result.removed = (result.removed ?? 0) + 1;
      }

      const remaining = await vault.list({ includeDeleted: true });
      const foldersNeededByFiles = new Set<string>();
      for (const entry of remaining) {
        const parts = entry.relativePath.replace(/\\/g, '/').split('/');
        let accumulated = '';
        for (let index = 0; index < parts.length - 1; index += 1) {
          const segment = parts[index];
          if (!segment) continue;
          accumulated = accumulated ? `${accumulated}/${segment}` : segment;
          foldersNeededByFiles.add(accumulated);
        }
      }

      const localFolders = await vault.listFolders();
      const extraFolders = localFolders
        .filter(folder => {
          const key = normalizeFolderKey(folder);
          if (remoteFolders.has(key)) return false;
          if (foldersNeededByFiles.has(key)) return false;
          return true;
        })
        .sort((a, b) => b.length - a.length);
      for (const folder of extraFolders) {
        await vault.deleteFolder(folder);
      }

      await writePushQueue(vault.adapter, []);
      memoryQueue.length = 0;
      await writeConflicts(vault.adapter, []);

      result.dirtyFolders = [];
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
  options?: { overwriteRemote?: boolean; ignorePatterns?: string[] },
): Promise<number> {
  const ignorePatterns =
    options?.ignorePatterns ?? (await readSyncIgnorePatterns(vault.adapter));
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
    const intent = intentFromEntry(entry, overwriteRemote, binding.bindingId, {
      ignorePatterns,
    });
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
    if (
      !entry ||
      isSyncExcludedPath(entry.relativePath) ||
      isUserSyncIgnored(entry.relativePath, ignorePatterns)
    ) {
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
    { ignorePatterns },
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
  entry: LocalAssetIndexEntry | undefined,
  fallbackBindingId: string,
): string {
  return op.bindingId || entry?.bindingId || fallbackBindingId;
}

function pendingPathsForBinding(
  entries: LocalAssetIndexEntry[],
  queue: QueuedPushOperation[],
  bindingId: string,
  fallbackBindingId: string,
  ignorePatterns: string[] = [],
): Set<string> {
  const paths = new Set<string>();
  for (const entry of entries) {
    if (entry.deletedAt && !entry.remotePath) {
      continue;
    }
    if (
      intentFromEntry(entry, false, bindingId, {
        ignorePatterns,
      })
    ) {
      paths.add(entry.relativePath);
    }
  }
  for (const op of queue) {
    if (isUserSyncIgnored(op.relativePath, ignorePatterns)) {
      continue;
    }
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
