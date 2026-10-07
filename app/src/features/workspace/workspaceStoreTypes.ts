import type { ImageItem, ImageUploadData } from '@pixuli/core/types';
import type { SyncStatusSummary, WorkspaceMode } from '@pixuli/core/vault';
import type { LibraryListScope } from '@/features/library/libraryListScope';
import type { WorkspaceReconnectHint } from '@/features/workspace/fsaReconnect';
import type { SyncRunOutcome } from '@/features/workspace/syncOutcome';

export interface WorkspaceState {
  mode: WorkspaceMode;
  rootPath: string | null;
  displayName: string | null;
  rootDisplayPath: string | null;
  /** 当前范围下的资源（可无预览 blob；见 deferPreview） */
  localImages: ImageItem[];
  /** 全库 relativePath，仅供文件夹树计数（无 blob） */
  indexPaths: string[];
  localFolders: string[];
  loading: boolean;
  pushing: boolean;
  syncing: boolean;
  syncStatus: SyncStatusSummary | null;
  error: string | null;
  syncMessage: string | null;
  syncOutcome: SyncRunOutcome | null;
  /** Web FSA：刷新后需用户手势重新授权 / 重选文件夹 */
  reconnect: WorkspaceReconnectHint | null;
  isLocalActive: () => boolean;
  needsWorkspaceSetup: () => boolean;
  initialize: () => Promise<void>;
  pickWorkspace: (options?: {
    pullAfter?: boolean;
    backend?: 'opfs' | 'fsa';
  }) => Promise<boolean>;
  /** 用户点击后恢复已保存的本机文件夹工作区 */
  reconnectWorkspace: () => Promise<boolean>;
  clearWorkspace: () => Promise<void>;
  resumeLocalWorkspace: () => Promise<boolean>;
  syncBindingsFromSources: () => Promise<void>;
  refreshLocalImages: (options?: LibraryListScope) => Promise<void>;
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
  moveLocalFiles: (
    relativePaths: string[],
    targetDir: string,
  ) => Promise<number>;
  clearError: () => void;
}

export type WorkspaceStoreGet = () => WorkspaceState;
export type WorkspaceStoreSet = (
  partial:
    | Partial<WorkspaceState>
    | ((state: WorkspaceState) => Partial<WorkspaceState>),
) => void;
