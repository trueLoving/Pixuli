import type { ImageItem, ImageUploadData } from '@pixuli/core/types';
import type { SyncStatusSummary, WorkspaceMode } from '@pixuli/core/vault';
import type { SyncRunOutcome } from '@/features/workspace/syncOutcome';

export interface WorkspaceState {
  mode: WorkspaceMode;
  rootPath: string | null;
  displayName: string | null;
  rootDisplayPath: string | null;
  localImages: ImageItem[];
  localFolders: string[];
  loading: boolean;
  pushing: boolean;
  syncing: boolean;
  syncStatus: SyncStatusSummary | null;
  error: string | null;
  syncMessage: string | null;
  syncOutcome: SyncRunOutcome | null;
  isLocalActive: () => boolean;
  needsWorkspaceSetup: () => boolean;
  initialize: () => Promise<void>;
  pickWorkspace: (options?: {
    pullAfter?: boolean;
    backend?: 'opfs' | 'fsa';
  }) => Promise<boolean>;
  clearWorkspace: () => Promise<void>;
  resumeLocalWorkspace: () => Promise<boolean>;
  syncBindingsFromSources: () => Promise<void>;
  refreshLocalImages: (options?: { quiet?: boolean }) => Promise<void>;
  refreshRootDisplayPath: () => Promise<void>;
  refreshSyncStatus: () => Promise<void>;
  scanWorkspace: () => Promise<void>;
  importLocalImage: (uploadData: ImageUploadData) => Promise<ImageItem | null>;
  updateLocalMetadata: (
    relativePath: string,
    patch: { name?: string; tags?: string[]; description?: string },
  ) => Promise<void>;
  pushPendingToRemote: () => Promise<SyncRunOutcome>;
  pullFromRemote: () => Promise<SyncRunOutcome>;
  runSync: (direction?: 'push' | 'pull' | 'both') => Promise<SyncRunOutcome>;
  softDeleteLocal: (relativePath: string) => Promise<void>;
  refreshLocalFolders: () => Promise<void>;
  createLocalFolder: (relativeDir: string) => Promise<void>;
  renameLocalFolder: (fromDir: string, toDir: string) => Promise<void>;
  deleteLocalFolder: (relativeDir: string) => Promise<number>;
  moveLocalFile: (relativePath: string, targetDir: string) => Promise<void>;
  clearError: () => void;
}

export type WorkspaceStoreGet = () => WorkspaceState;
export type WorkspaceStoreSet = (
  partial:
    | Partial<WorkspaceState>
    | ((state: WorkspaceState) => Partial<WorkspaceState>),
) => void;
