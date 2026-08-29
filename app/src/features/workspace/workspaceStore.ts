import { registerWorkspaceLibraryPort } from '@/features/library/workspaceImageBridge';
import {
  clearWorkspace,
  initializeWorkspace,
  pickWorkspace,
  resumeLocalWorkspace,
  syncBindingsFromSources,
} from '@/features/workspace/workspaceSetupService';
import {
  createLocalFolder,
  deleteLocalFolder,
  importLocalImage,
  moveLocalFile,
  refreshLocalFolders,
  refreshLocalImages,
  refreshRootDisplayPath,
  renameLocalFolder,
  scanWorkspace,
  softDeleteLocal,
  updateLocalMetadata,
} from '@/features/workspace/workspaceLocalActions';
import {
  refreshSyncStatus,
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
  localImages: [],
  localFolders: [],
  loading: false,
  pushing: false,
  syncing: false,
  syncStatus: null,
  error: null,
  syncMessage: null,
  syncOutcome: null,

  isLocalActive: () => isWorkspaceAvailable() && get().mode === 'local',

  needsWorkspaceSetup: () => isWorkspaceAvailable() && get().mode === 'unset',

  initialize: () => initializeWorkspace(get, set),

  resumeLocalWorkspace: () => resumeLocalWorkspace(get, set),

  syncBindingsFromSources: () => syncBindingsFromSources(get),

  pickWorkspace: options => pickWorkspace(get, set, options),

  clearWorkspace: () => clearWorkspace(get, set),

  refreshRootDisplayPath: () => refreshRootDisplayPath(get, set),

  refreshLocalImages: options => refreshLocalImages(get, set, options),

  refreshLocalFolders: () => refreshLocalFolders(get, set),

  createLocalFolder: relativeDir => createLocalFolder(get, set, relativeDir),

  renameLocalFolder: (fromDir, toDir) =>
    renameLocalFolder(get, set, fromDir, toDir),

  deleteLocalFolder: relativeDir => deleteLocalFolder(get, set, relativeDir),

  moveLocalFile: (relativePath, targetDir) =>
    moveLocalFile(get, set, relativePath, targetDir),

  refreshSyncStatus: () => refreshSyncStatus(get, set),

  scanWorkspace: () => scanWorkspace(get, set),

  importLocalImage: uploadData => importLocalImage(get, set, uploadData),

  updateLocalMetadata: (relativePath, patch) =>
    updateLocalMetadata(get, set, relativePath, patch),

  pushPendingToRemote: () => runWorkspaceSync(get, set, 'push'),

  pullFromRemote: () => runWorkspaceSync(get, set, 'pull'),

  runSync: direction => runWorkspaceSync(get, set, direction),

  softDeleteLocal: relativePath => softDeleteLocal(get, set, relativePath),

  clearError: () => set({ error: null, syncOutcome: null }),
}));

registerWorkspaceModeReader(() => useWorkspaceStore.getState().mode);

registerWorkspaceLibraryPort({
  isLocalActive: () => useWorkspaceStore.getState().isLocalActive(),
  refreshLocalImages: options =>
    useWorkspaceStore.getState().refreshLocalImages(options),
  getLocalImages: () => useWorkspaceStore.getState().localImages,
  importLocalImage: uploadData =>
    useWorkspaceStore.getState().importLocalImage(uploadData),
  softDeleteLocal: relativePath =>
    useWorkspaceStore.getState().softDeleteLocal(relativePath),
  moveLocalFile: (relativePath, targetDir) =>
    useWorkspaceStore.getState().moveLocalFile(relativePath, targetDir),
  updateLocalMetadata: (relativePath, patch) =>
    useWorkspaceStore.getState().updateLocalMetadata(relativePath, patch),
});

export type { WorkspaceState } from '@/features/workspace/workspaceStoreTypes';
