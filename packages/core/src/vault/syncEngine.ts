import type {
  SyncEngine,
  SyncPushOperation,
  SyncRunOptions,
  SyncRunResult,
  SyncStatusSummary,
} from './types';
import { nowIso } from './utils';

export interface CreateSyncEngineOptions {
  /** P3：绑定 LocalVault 与 Provider 后实现 push/pull */
  onEnqueue?: (op: SyncPushOperation) => void | Promise<void>;
}

/**
 * SyncEngine MVP 骨架（REF-607 P1）：内存队列 + 状态汇总；push/pull 在 P3 实现。
 */
export function createSyncEngine(
  options: CreateSyncEngineOptions = {},
): SyncEngine {
  const queue: SyncPushOperation[] = [];
  let lastSyncAt: string | null = null;

  return {
    async enqueuePush(op) {
      queue.push(op);
      await options.onEnqueue?.(op);
    },

    async getStatus(): Promise<SyncStatusSummary> {
      return {
        lastSyncAt,
        pendingPush: queue.length,
        conflicts: 0,
        bindings: {},
      };
    },

    async run(runOptions?: SyncRunOptions): Promise<SyncRunResult> {
      const direction = runOptions?.direction ?? 'both';
      const result: SyncRunResult = {
        pushed: 0,
        pulled: 0,
        conflicts: [],
        errors: [],
      };

      if (direction === 'push' || direction === 'both') {
        result.pushed = queue.length;
        queue.length = 0;
      }

      lastSyncAt = nowIso();
      return result;
    },
  };
}
