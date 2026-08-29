import {
  buildSyncResultOutcome,
  type SyncRunOutcome,
} from '@/features/workspace/syncOutcome';
import {
  getWorkspaceSyncEngine,
  getWorkspaceVault,
  resolveSelectedProvider,
} from '@/features/workspace/workspaceRuntime';
import type {
  WorkspaceStoreGet,
  WorkspaceStoreSet,
} from '@/features/workspace/workspaceStoreTypes';

export async function refreshSyncStatus(
  get: WorkspaceStoreGet,
  set: WorkspaceStoreSet,
): Promise<void> {
  if (get().mode !== 'local') {
    return;
  }
  try {
    const status = await getWorkspaceSyncEngine().getStatus();
    set({ syncStatus: status });
  } catch {
    // ignore status refresh errors
  }
}

export async function runWorkspaceSync(
  get: WorkspaceStoreGet,
  set: WorkspaceStoreSet,
  direction: 'push' | 'pull' | 'both' = 'both',
): Promise<SyncRunOutcome> {
  if (get().mode !== 'local') {
    const outcome: SyncRunOutcome = {
      kind: 'error',
      parts: [{ key: 'workspace.syncNeedsLocal' }],
    };
    set({ error: null, syncOutcome: outcome, syncMessage: null });
    return outcome;
  }

  if (resolveSelectedProvider() === null) {
    const outcome: SyncRunOutcome = {
      kind: 'error',
      parts: [{ key: 'workspace.syncNeedsRemote' }],
    };
    set({ error: null, syncOutcome: outcome, syncMessage: null });
    return outcome;
  }

  if (direction === 'push') {
    const entries = await getWorkspaceVault().list({ includeDeleted: true });
    const hasPushable =
      entries.some(entry => !entry.deletedAt) ||
      entries.some(
        entry =>
          entry.deletedAt &&
          (entry.remotePath || entry.syncState === 'pending-push'),
      );
    const status = await getWorkspaceSyncEngine().getStatus();
    if (!hasPushable && status.pendingPush === 0) {
      const outcome: SyncRunOutcome = {
        kind: 'info',
        parts: [{ key: 'workspace.syncNothingToPush' }],
      };
      set({ syncOutcome: outcome, syncMessage: null, error: null });
      return outcome;
    }
  }

  set({
    syncing: true,
    pushing: direction === 'push' || direction === 'both',
    error: null,
    syncMessage: null,
    syncOutcome: null,
  });

  try {
    const result = await getWorkspaceSyncEngine().run({ direction });
    await get().refreshLocalImages();
    await get().refreshSyncStatus();

    if (result.errors.length > 0) {
      const outcome: SyncRunOutcome = {
        kind: 'error',
        parts: [{ key: 'workspace.syncFailed' }],
        rawMessage: result.errors.map(item => item.message).join('；'),
      };
      set({
        syncing: false,
        pushing: false,
        error: outcome.rawMessage ?? null,
        syncOutcome: outcome,
      });
      return outcome;
    }

    const outcome = buildSyncResultOutcome(result);
    set({
      syncing: false,
      pushing: false,
      syncOutcome: outcome,
      error: null,
    });
    return outcome;
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : undefined;
    const outcome: SyncRunOutcome = {
      kind: 'error',
      parts: [{ key: 'workspace.syncFailed' }],
      rawMessage,
    };
    set({
      syncing: false,
      pushing: false,
      error: rawMessage ?? null,
      syncOutcome: outcome,
    });
    return outcome;
  }
}
