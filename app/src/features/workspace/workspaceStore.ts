import { registerWorkspaceLibraryPort } from '@/features/library/workspaceAssetBridge';
import {
  clearWorkspace,
  initializeWorkspace,
  pickWorkspace,
  reconnectWorkspace,
  resumeLocalWorkspace,
  syncBindingsFromSources,
} from '@/features/workspace/workspaceSetupService';
import {
  createLocalFolder,
  deleteLocalFolder,
  importLocalAsset,
  moveLocalFile,
  moveLocalFiles,
  refreshLocalFolders,
  refreshLocalAssets,
  refreshRootDisplayPath,
  renameLocalFolder,
  scanWorkspace,
  softDeleteLocal,
  updateLocalMetadata,
} from '@/features/workspace/workspaceLocalActions';
import {
  clearWorkspaceCheckpoint,
  getLatestCheckpointMeta,
  pullDirtyFolderIfNeeded,
  refreshSyncStatus,
  restoreWorkspaceCheckpoint,
  runWorkspaceSync,
} from '@/features/workspace/workspaceSyncActions';
import type { WorkspaceState } from '@/features/workspace/workspaceStoreTypes';
import { registerWorkspaceModeReader } from '@/features/workspace/workspaceRuntime';
import { isWorkspaceAvailable } from '@/platforms/workspacePlatform';
import { create } from 'zustand';

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  mode: 'unset',
  rootPath: null,
  displayName: null,
  rootDisplayPath: null,
  localAssets: [],
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

  isLocalActive: () => isWorkspaceAvailable() && get().mode === 'local',

  needsWorkspaceSetup: () => isWorkspaceAvailable() && get().mode === 'unset',

  initialize: () => initializeWorkspace(get, set),

  resumeLocalWorkspace: () => resumeLocalWorkspace(get, set),

  syncBindingsFromSources: () => syncBindingsFromSources(get),

  pickWorkspace: options => pickWorkspace(get, set, options),

  reconnectWorkspace: () => reconnectWorkspace(get, set),

  clearWorkspace: () => clearWorkspace(get, set),

  refreshRootDisplayPath: () => refreshRootDisplayPath(get, set),

  refreshLocalAssets: options => refreshLocalAssets(get, set, options),

  refreshLocalFolders: () => refreshLocalFolders(get, set),

  createLocalFolder: relativeDir => createLocalFolder(get, set, relativeDir),

  renameLocalFolder: (fromDir, toDir) =>
    renameLocalFolder(get, set, fromDir, toDir),

  deleteLocalFolder: relativeDir => deleteLocalFolder(get, set, relativeDir),

  moveLocalFile: (relativePath, targetDir) =>
    moveLocalFile(get, set, relativePath, targetDir),

  moveLocalFiles: (relativePaths, targetDir) =>
    moveLocalFiles(get, set, relativePaths, targetDir),

  refreshSyncStatus: () => refreshSyncStatus(get, set),

  scanWorkspace: () => scanWorkspace(get, set),

  importLocalAsset: uploadData => importLocalAsset(get, set, uploadData),

  updateLocalMetadata: (relativePath, patch) =>
    updateLocalMetadata(get, set, relativePath, patch),

  pushPendingToRemote: () => runWorkspaceSync(get, set, 'push'),

  pullFromRemote: () => runWorkspaceSync(get, set, 'pull'),

  runSync: direction => runWorkspaceSync(get, set, direction),

  getLatestCheckpointMeta: () => getLatestCheckpointMeta(),

  restoreCheckpoint: () => restoreWorkspaceCheckpoint(get, set),

  clearCheckpoint: () => clearWorkspaceCheckpoint(get, set),

  pullDirtyFolderIfNeeded: folderPath =>
    pullDirtyFolderIfNeeded(get, set, folderPath),

  softDeleteLocal: relativePath => softDeleteLocal(get, set, relativePath),

  clearError: () => set({ error: null, syncOutcome: null }),
}));

registerWorkspaceModeReader(() => useWorkspaceStore.getState().mode);

registerWorkspaceLibraryPort({
  isLocalActive: () => useWorkspaceStore.getState().isLocalActive(),
  refreshLocalAssets: options =>
    useWorkspaceStore.getState().refreshLocalAssets(options),
  getLocalAssets: () => useWorkspaceStore.getState().localAssets,
  getScopedTotal: () => useWorkspaceStore.getState().scopedTotal,
  importLocalAsset: uploadData =>
    useWorkspaceStore.getState().importLocalAsset(uploadData),
  softDeleteLocal: relativePath =>
    useWorkspaceStore.getState().softDeleteLocal(relativePath),
  moveLocalFile: (relativePath, targetDir) =>
    useWorkspaceStore.getState().moveLocalFile(relativePath, targetDir),
  updateLocalMetadata: (relativePath, patch) =>
    useWorkspaceStore.getState().updateLocalMetadata(relativePath, patch),
});

export type { WorkspaceState } from '@/features/workspace/workspaceStoreTypes';
