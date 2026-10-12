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
  intentFromEntry,
  mergePushIntent,
  type SyncPushIntent,
} from './syncApply';
import { isSyncExcludedPath } from './syncPath';
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
 * SyncEngine（REF-607 P3）：持久化 push 队列、单向 pull、游标。
 * 普通 push 只发送本地变更，同一路径多次入队合并成一次；
 * `overwriteRemote` 才整库覆盖远端。pull 仍以远端为准覆盖本地。
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
            { overwriteRemote: runOptions?.overwriteRemote === true },
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
  options?: { overwriteRemote?: boolean },
): Promise<number> {
  const persisted = await readPushQueue(vault.adapter);
  const queue = [...persisted, ...toQueued(memoryQueue, binding.bindingId)];
  const overwriteRemote = options?.overwriteRemote === true;
  const intents = new Map<string, SyncPushIntent>();

  const entries = await vault.list({ includeDeleted: true });
  for (const entry of entries) {
    if (entry.deletedAt && !entry.remotePath) {
      // 从未成功上云的 tombstone：只清本地，勿对远端 DELETE（易 404 拖垮整批）
      await vault.removeEntry(entry.relativePath);
      continue;
    }
    const intent = intentFromEntry(entry, overwriteRemote);
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
    await writePushQueue(vault.adapter, []);
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

  // 队列里可能仍指向已无 remotePath 的 delete：再滤一遍
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
    await writePushQueue(vault.adapter, []);
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
