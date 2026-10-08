import { useSourceStore } from '@/features/settings/sourceStore';
import { notifyWorkspaceCleared } from '@/features/library/workspaceImageBridge';
import {
  clearPersistedWorkspace,
  loadPersistedWorkspace,
  savePersistedWorkspace,
  saveWorkspaceModePref,
} from '@/features/workspace/workspacePersist';
import { resolveWorkspaceRootDisplayPath } from '@/features/workspace/workspacePathDisplay';
import {
  getWorkspaceVault,
  resetWorkspaceRuntime,
  resetWorkspaceSyncEngineOnly,
} from '@/features/workspace/workspaceRuntime';
import type {
  WorkspaceStoreGet,
  WorkspaceStoreSet,
} from '@/features/workspace/workspaceStoreTypes';
import {
  getWorkspaceAdapter,
  isMobileWorkspaceActive,
  isWebWorkspaceActive,
  isWorkspaceAvailable,
} from '@/platforms/workspacePlatform';
import { isMobileWorkspaceAdapter } from '@/platforms/mobile/workspaceAdapter';
import { isWebWorkspaceAdapter } from '@/platforms/web/workspaceAdapter';
import {
  deleteFsaDirectoryHandle,
  parseFsaRootPath,
} from '@/platforms/web/fsaWorkspaceFs';
import { buildReconnectHint } from '@/features/workspace/fsaReconnect';
import {
  storedSourcesToWorkspaceBindings,
  type LocalVault,
} from '@pixuli/core/vault';

function getAdapter() {
  return getWorkspaceAdapter();
}

export async function cleanupFsaWorkspaceRoot(
  rootPath: string | null,
): Promise<void> {
  if (!rootPath) {
    return;
  }
  const workspaceId = parseFsaRootPath(rootPath);
  if (!workspaceId) {
    return;
  }
  try {
    await deleteFsaDirectoryHandle(workspaceId);
  } catch {
    // ignore stale handle cleanup errors
  }
}

async function pickAdapterRoot(
  adapter: ReturnType<typeof getWorkspaceAdapter>,
  backend?: 'opfs' | 'fsa',
): Promise<boolean> {
  if (backend === 'fsa' && isWebWorkspaceAdapter(adapter)) {
    return adapter.pickFsaRoot();
  }
  return adapter.pickRoot();
}

function readFolderLabel(
  adapter: ReturnType<typeof getWorkspaceAdapter>,
): string | null {
  if (isWebWorkspaceAdapter(adapter) || isMobileWorkspaceAdapter(adapter)) {
    return adapter.getFolderLabel();
  }
  return null;
}

export async function openVaultWithRoot(rootPath: string): Promise<LocalVault> {
  const adapter = getAdapter();
  if ('setRootPath' in adapter && typeof adapter.setRootPath === 'function') {
    adapter.setRootPath(rootPath);
  }
  if (window.workspaceAPI) {
    await window.workspaceAPI.setRoot(rootPath);
  }
  const vault = getWorkspaceVault();
  await vault.open();
  return vault;
}

export async function refreshAndPersistRootDisplayPath(
  rootPath: string | null,
  apply: (rootDisplayPath: string | null) => void,
): Promise<void> {
  const persisted = loadPersistedWorkspace();
  const resolved = await resolveWorkspaceRootDisplayPath(
    rootPath,
    persisted?.absolutePath,
  );
  apply(resolved);
  if (
    resolved &&
    rootPath?.startsWith('fsa://') &&
    persisted?.rootPath === rootPath &&
    resolved !== persisted.absolutePath
  ) {
    savePersistedWorkspace(
      persisted.rootPath,
      persisted.workspaceId,
      persisted.folderLabel,
      resolved,
    );
  }
}

export async function initializeWorkspace(
  get: WorkspaceStoreGet,
  set: WorkspaceStoreSet,
): Promise<void> {
  if (!isWorkspaceAvailable()) {
    set({
      mode: 'unset',
      error: isWebWorkspaceActive()
        ? '当前浏览器不支持本地工作区（需 OPFS 或文件夹访问 API）'
        : isMobileWorkspaceActive()
          ? '当前设备无法初始化本地工作区'
          : null,
    });
    return;
  }

  const persisted = loadPersistedWorkspace();
  if (!persisted?.rootPath) {
    set({ mode: 'unset' });
    return;
  }

  set({ loading: true, error: null, reconnect: null });
  try {
    const vault = await openVaultWithRoot(persisted.rootPath);
    const config = vault.getConfig();
    const folderLabel =
      persisted.folderLabel ?? readFolderLabel(getAdapter()) ?? undefined;
    savePersistedWorkspace(persisted.rootPath, config.workspaceId, folderLabel);
    saveWorkspaceModePref('local');
    set({
      mode: 'local',
      rootPath: persisted.rootPath,
      displayName: folderLabel ?? config.displayName,
      loading: false,
      reconnect: null,
    });
    await refreshAndPersistRootDisplayPath(
      persisted.rootPath,
      rootDisplayPath => set({ rootDisplayPath }),
    );
    await get().syncBindingsFromSources();
    await get().refreshLocalImages();
    await get().refreshSyncStatus();
  } catch (error) {
    const message = error instanceof Error ? error.message : '工作区初始化失败';
    set({
      mode: 'unset',
      loading: false,
      error: message,
      reconnect: buildReconnectHint(
        persisted.rootPath,
        persisted.folderLabel,
        message,
      ),
    });
  }
}

export async function resumeLocalWorkspace(
  get: WorkspaceStoreGet,
  set: WorkspaceStoreSet,
): Promise<boolean> {
  if (!isWorkspaceAvailable()) {
    return false;
  }
  const persisted = loadPersistedWorkspace();
  if (!persisted?.rootPath) {
    set({ mode: 'unset' });
    return false;
  }

  set({ loading: true, error: null, reconnect: null });
  try {
    resetWorkspaceRuntime();
    const vault = await openVaultWithRoot(persisted.rootPath);
    const config = vault.getConfig();
    const folderLabel =
      persisted.folderLabel ?? readFolderLabel(getAdapter()) ?? undefined;
    saveWorkspaceModePref('local');
    set({
      mode: 'local',
      rootPath: persisted.rootPath,
      displayName: folderLabel ?? config.displayName,
      loading: false,
      syncMessage: null,
      syncOutcome: null,
      reconnect: null,
    });
    await refreshAndPersistRootDisplayPath(
      persisted.rootPath,
      rootDisplayPath => set({ rootDisplayPath }),
    );
    await get().syncBindingsFromSources();
    await get().refreshLocalImages();
    await get().refreshSyncStatus();
    return true;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '恢复本地工作区失败';
    set({
      mode: 'unset',
      loading: false,
      error: message,
      reconnect: buildReconnectHint(
        persisted.rootPath,
        persisted.folderLabel,
        message,
      ),
    });
    return false;
  }
}

/**
 * 用户手势下恢复 FSA 工作区：先重新授权已保存句柄，失败则请用户再选同一文件夹。
 */
export async function reconnectWorkspace(
  get: WorkspaceStoreGet,
  set: WorkspaceStoreSet,
): Promise<boolean> {
  if (!isWorkspaceAvailable() || !isWebWorkspaceActive()) {
    return false;
  }
  const persisted = loadPersistedWorkspace();
  const hint = get().reconnect;
  const rootPath = hint?.rootPath ?? persisted?.rootPath ?? null;
  const workspaceId = rootPath ? parseFsaRootPath(rootPath) : null;
  if (!rootPath || !workspaceId || !persisted) {
    return false;
  }

  set({ loading: true, error: null });
  try {
    resetWorkspaceRuntime();
    const adapter = getAdapter();
    if (!isWebWorkspaceAdapter(adapter)) {
      set({ loading: false });
      return false;
    }

    adapter.setRootPath(rootPath);
    let restored = await adapter.restoreFsaPermission();
    if (!restored) {
      restored = await adapter.rebindFsaRoot(workspaceId);
    }
    if (!restored || !adapter.getRootPath()) {
      set({
        loading: false,
        error: 'workspace.reconnectFailed',
        reconnect: buildReconnectHint(
          rootPath,
          hint?.folderLabel ?? persisted.folderLabel,
          'Folder permission denied',
        ),
      });
      return false;
    }

    const nextRoot = adapter.getRootPath()!;
    const folderLabel =
      readFolderLabel(adapter) ?? persisted.folderLabel ?? undefined;
    const vault = await openVaultWithRoot(nextRoot);
    const config = vault.getConfig();
    savePersistedWorkspace(nextRoot, config.workspaceId, folderLabel);
    saveWorkspaceModePref('local');
    set({
      mode: 'local',
      rootPath: nextRoot,
      displayName: folderLabel ?? config.displayName,
      loading: false,
      error: null,
      reconnect: null,
      syncMessage: null,
      syncOutcome: null,
    });
    await refreshAndPersistRootDisplayPath(nextRoot, rootDisplayPath =>
      set({ rootDisplayPath }),
    );
    await get().syncBindingsFromSources();
    await get().refreshLocalImages();
    await get().refreshSyncStatus();
    return true;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'workspace.reconnectFailed';
    set({
      mode: 'unset',
      loading: false,
      error: message,
      reconnect: buildReconnectHint(
        rootPath,
        hint?.folderLabel ?? persisted.folderLabel,
        message,
      ),
    });
    return false;
  }
}

export async function syncBindingsFromSources(
  get: WorkspaceStoreGet,
): Promise<void> {
  if (get().mode !== 'local') {
    return;
  }
  const sources = useSourceStore.getState().sources;
  await getWorkspaceVault().upsertBindings(
    storedSourcesToWorkspaceBindings(sources),
    { replace: true },
  );
  resetWorkspaceSyncEngineOnly();
}

export async function pickWorkspace(
  get: WorkspaceStoreGet,
  set: WorkspaceStoreSet,
  options?: { pullAfter?: boolean; backend?: 'opfs' | 'fsa' },
): Promise<boolean> {
  if (!isWorkspaceAvailable()) {
    return false;
  }

  const previousRootPath = get().rootPath;
  const previousDisplayName = get().displayName;
  const hadLocal = get().mode === 'local' && Boolean(previousRootPath);

  set({ loading: true, error: null, reconnect: null });
  try {
    resetWorkspaceRuntime();
    const adapter = getAdapter();
    const picked = await pickAdapterRoot(adapter, options?.backend);
    if (!picked || !adapter.getRootPath()) {
      if (hadLocal && previousRootPath) {
        await openVaultWithRoot(previousRootPath);
        set({
          mode: 'local',
          rootPath: previousRootPath,
          displayName: previousDisplayName,
          loading: false,
        });
        await get().refreshLocalImages();
        await get().refreshSyncStatus();
      } else {
        set({ loading: false });
      }
      return false;
    }

    const rootPath = adapter.getRootPath()!;
    const folderLabel = readFolderLabel(adapter) ?? undefined;
    const vault = await openVaultWithRoot(rootPath);
    const config = vault.getConfig();
    savePersistedWorkspace(rootPath, config.workspaceId, folderLabel);
    saveWorkspaceModePref('local');

    if (previousRootPath && previousRootPath !== rootPath) {
      await cleanupFsaWorkspaceRoot(previousRootPath);
    }

    set({
      mode: 'local',
      rootPath,
      displayName: folderLabel ?? config.displayName,
      loading: false,
      syncMessage: null,
      syncOutcome: null,
      reconnect: null,
    });
    await refreshAndPersistRootDisplayPath(rootPath, rootDisplayPath =>
      set({ rootDisplayPath }),
    );
    await get().syncBindingsFromSources();
    await get().refreshLocalImages();
    await get().refreshSyncStatus();
    if (options?.pullAfter) {
      await get().pullFromRemote();
    }
    return true;
  } catch (error) {
    set({
      loading: false,
      error: error instanceof Error ? error.message : '选择工作区失败',
    });
    return false;
  }
}

export async function clearWorkspace(
  get: WorkspaceStoreGet,
  set: WorkspaceStoreSet,
): Promise<void> {
  const { rootPath } = get();
  await cleanupFsaWorkspaceRoot(rootPath);
  clearPersistedWorkspace();
  resetWorkspaceRuntime();
  set({
    mode: 'unset',
    rootPath: null,
    displayName: null,
    rootDisplayPath: null,
    localImages: [],
    scopedTotal: 0,
    indexPaths: [],
    localFolders: [],
    loading: false,
    pushing: false,
    syncing: false,
    syncStatus: null,
    error: null,
    syncMessage: null,
    syncOutcome: null,
    reconnect: null,
  });
  notifyWorkspaceCleared();
}
