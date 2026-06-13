import type { StorageProvider, StorageProviderSync } from '../plugins/types';
import { hasStorageProviderSync } from '../plugins/types';
import {
  appendPushQueue,
  getBindingSyncState,
  readConflicts,
  readPushQueue,
  updateBindingSyncState,
  writePushQueue,
  type QueuedPushOperation,
} from './syncPersistence';
import {
  applySyncPull,
  assertSyncProvider,
  buildSyncPushItems,
} from './syncApply';
import type {
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
}

export interface CreateSyncEngineOptions {
  vault: LocalVault;
  getBindings: () => SyncEngineBinding[];
  readFileBytes?: (relativePath: string) => Promise<Uint8Array>;
  fetch?: typeof fetch;
  onEnqueue?: (op: SyncPushOperation) => void | Promise<void>;
}

/**
 * SyncEngine MVP（REF-607 P3）：持久化 push 队列、单向 pull、游标与冲突登记。
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

  const countPendingPush = async (): Promise<number> => {
    const persisted = await readPushQueue(vault.adapter);
    const entries = await vault.list();
    const pendingEntries = entries.filter(
      entry =>
        !entry.deletedAt &&
        (entry.syncState === 'local-only' ||
          entry.syncState === 'pending-push'),
    ).length;
    return persisted.length + memoryQueue.length + pendingEntries;
  };

  return {
    async enqueuePush(op) {
      memoryQueue.push(op);
      await appendPushQueue(vault.adapter, op);
      await onEnqueue?.(op);
    },

    async getStatus(): Promise<SyncStatusSummary> {
      const bindings = getBindings();
      const stateBindings: SyncStatusSummary['bindings'] = {};
      let lastSyncAt: string | null = null;

      for (const binding of bindings) {
        const record = await getBindingSyncState(
          vault.adapter,
          binding.bindingId,
        );
        const queue = await readPushQueue(vault.adapter);
        const pendingForBinding = queue.filter(
          item => !item.bindingId || item.bindingId === binding.bindingId,
        ).length;
        stateBindings[binding.bindingId] = {
          cursor: record.cursor,
          lastSyncAt: record.lastSyncAt,
          pendingPush: pendingForBinding,
        };
        if (
          record.lastSyncAt &&
          (!lastSyncAt || record.lastSyncAt > lastSyncAt)
        ) {
          lastSyncAt = record.lastSyncAt;
        }
      }

      const conflicts = await readConflicts(vault.adapter);

      return {
        lastSyncAt,
        pendingPush: await countPendingPush(),
        conflicts: conflicts.length,
        bindings: stateBindings,
      };
    },

    async run(runOptions?: SyncRunOptions): Promise<SyncRunResult> {
      const direction = runOptions?.direction ?? 'both';
      const binding = resolveBinding(runOptions?.bindingId);
      const provider = assertSyncProvider(binding.provider);
      const result: SyncRunResult = {
        pushed: 0,
        pulled: 0,
        conflicts: [],
        errors: [],
      };

      if (direction === 'push' || direction === 'both') {
        try {
          result.pushed += await flushPushQueue(
            vault,
            binding,
            provider,
            readFileBytes,
            memoryQueue,
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
          const bindingState = await getBindingSyncState(
            vault.adapter,
            binding.bindingId,
          );
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

          await updateBindingSyncState(vault.adapter, binding.bindingId, {
            cursor: pullResult.nextCursor ?? nowIso(),
            lastSyncAt: nowIso(),
          });
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

async function flushPushQueue(
  vault: LocalVault,
  binding: SyncEngineBinding,
  provider: StorageProvider & StorageProviderSync,
  readFileBytes: (relativePath: string) => Promise<Uint8Array>,
  memoryQueue: SyncPushOperation[],
): Promise<number> {
  const persisted = await readPushQueue(vault.adapter);
  const queue = [...persisted, ...toQueued(memoryQueue, binding.bindingId)];

  const entries = await vault.list();
  const pendingPaths = new Set<string>();
  for (const entry of entries) {
    if (
      !entry.deletedAt &&
      (entry.syncState === 'local-only' || entry.syncState === 'pending-push')
    ) {
      pendingPaths.add(entry.relativePath);
    }
  }
  for (const op of queue) {
    pendingPaths.add(op.relativePath);
  }

  if (pendingPaths.size === 0) {
    return 0;
  }

  const items = await buildSyncPushItems(
    vault,
    binding.bindingId,
    [...pendingPaths],
    readFileBytes,
  );

  await provider.syncPush(items);

  let pushed = 0;
  for (const item of items) {
    if (item.action === 'delete') {
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

  await writePushQueue(vault.adapter, []);
  memoryQueue.length = 0;
  return pushed;
}

function toQueued(
  ops: SyncPushOperation[],
  bindingId: string,
): QueuedPushOperation[] {
  return ops.map(op => ({
    ...op,
    bindingId,
    enqueuedAt: nowIso(),
  }));
}

export function providerSupportsSync(
  provider: StorageProvider,
): provider is StorageProvider & StorageProviderSync {
  return hasStorageProviderSync(provider);
}
