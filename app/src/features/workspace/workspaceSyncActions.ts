import {
  buildSyncResultOutcome,
  type SyncRunOutcome,
} from '@/features/workspace/syncOutcome';
import { useSourceStore } from '@/features/settings/sourceStore';
import {
  getWorkspaceSyncEngine,
  getWorkspaceVault,
  resolveSelectedProvider,
} from '@/features/workspace/workspaceRuntime';
import { useUIStore } from '@/stores/uiStore';
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
    const status = await getWorkspaceSyncEngine().getStatus(
      useSourceStore.getState().selectedSourceId ?? undefined,
    );
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
    const bindingId = useSourceStore.getState().selectedSourceId ?? undefined;
    const status = await getWorkspaceSyncEngine().getStatus(bindingId);
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
    const selectedFolder =
      useUIStore.getState().selectedFolderPath?.trim() ?? '';
    const result = await getWorkspaceSyncEngine().run({
      direction,
      bindingId: useSourceStore.getState().selectedSourceId ?? undefined,
      pathPrefix: selectedFolder,
    });
    await get().refreshLocalFolders();
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

/** 进入文件夹时：若该层 stamp 为脏则浅拉取一层 */
export async function pullDirtyFolderIfNeeded(
  get: WorkspaceStoreGet,
  set: WorkspaceStoreSet,
  folderPath: string | null | undefined,
): Promise<void> {
  if (get().mode !== 'local') {
    return;
  }
  if (resolveSelectedProvider() === null) {
    return;
  }
  const folderKey = (folderPath ?? '').replace(/^\/+|\/+$/g, '');
  try {
    const engine = getWorkspaceSyncEngine();
    const bindingId = useSourceStore.getState().selectedSourceId ?? undefined;
    const dirty = await engine.listDirtyFolders(bindingId);
    if (!dirty.includes(folderKey)) {
      return;
    }
    const result = await engine.syncFolder(folderKey, {
      bindingId,
      direction: 'pull',
    });
    if (result.errors.length > 0) {
      set({
        error: result.errors.map(item => item.message).join('；'),
      });
      return;
    }
    await get().refreshLocalFolders();
    await get().refreshLocalImages();
    await get().refreshSyncStatus();
  } catch {
    // 懒加载失败不阻断浏览；显式 pull 仍可重试
  }
}
