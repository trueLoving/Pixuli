import type { StorageProviderConfig } from '../plugins/types';
import type { ImageCaptureMetadata } from '../types/imageCapture';

export type WorkspaceAdapterKind = 'desktop' | 'web' | 'mobile';

/** 读写工作区文件的端口；由各端实现（Desktop FS / Web OPFS / Mobile SAF） */
export interface WorkspaceAdapter {
  readonly kind: WorkspaceAdapterKind;
  isReady(): boolean;
  /** Desktop 绝对路径；Web/Mobile 为虚拟根 id */
  getRootPath(): string | null;
  pickRoot(): Promise<boolean>;
  readFile(relativePath: string): Promise<Uint8Array>;
  writeFile(relativePath: string, data: Uint8Array): Promise<void>;
  deleteFile(relativePath: string): Promise<void>;
  listFiles(
    relativeDir: string,
    options?: { recursive?: boolean },
  ): Promise<string[]>;
  exists(relativePath: string): Promise<boolean>;
}

export interface WorkspaceBinding {
  id: string;
  label: string;
  pluginId: string;
  remotePathPrefix: string;
  localPathPrefix: string;
  config: StorageProviderConfig;
}

export interface WorkspaceConfig {
  schemaVersion: number;
  workspaceId: string;
  displayName: string;
  createdAt: string;
  bindings: WorkspaceBinding[];
}

export type LocalImageSyncState =
  | 'local-only'
  | 'synced'
  | 'pending-push'
  | 'conflict';

export interface LocalImageIndexEntry {
  id: string;
  relativePath: string;
  name: string;
  size: number;
  width: number;
  height: number;
  mimeType: string;
  tags: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  bindingId?: string;
  remotePath?: string;
  syncState?: LocalImageSyncState;
  /** REF-511 #141 */
  captureMetadata?: ImageCaptureMetadata;
}

export interface LocalListOptions {
  bindingId?: string;
  includeDeleted?: boolean;
  search?: string;
}

export interface LocalVault {
  readonly adapter: WorkspaceAdapter;
  open(): Promise<void>;
  getConfig(): WorkspaceConfig;
  list(options?: LocalListOptions): Promise<LocalImageIndexEntry[]>;
  getByPath(relativePath: string): Promise<LocalImageIndexEntry | null>;
  importFile(
    source: File | string,
    targetRelativePath: string,
    meta?: Partial<LocalImageIndexEntry>,
  ): Promise<LocalImageIndexEntry>;
  updateMetadata(
    relativePath: string,
    patch: Partial<Pick<LocalImageIndexEntry, 'name' | 'tags' | 'description'>>,
  ): Promise<LocalImageIndexEntry>;
  softDelete(relativePath: string): Promise<void>;
  scan(): Promise<number>;
  updateSyncMeta(
    relativePath: string,
    patch: Partial<
      Pick<LocalImageIndexEntry, 'syncState' | 'remotePath' | 'bindingId'>
    >,
  ): Promise<LocalImageIndexEntry>;
  /** 写入 bindings；默认按 id 合并，replace 时整表替换（REF-607 P4 sourceStore 同步） */
  upsertBindings(
    bindings: WorkspaceBinding[],
    options?: { replace?: boolean },
  ): Promise<WorkspaceConfig>;
}

export type SyncDirection = 'push' | 'pull' | 'both';

export type SyncPushOperation =
  | { type: 'upload'; relativePath: string }
  | { type: 'delete'; relativePath: string; remotePath?: string }
  | { type: 'metadata'; relativePath: string };

export interface SyncConflict {
  relativePath: string;
  bindingId?: string;
  localRev?: string;
  remoteRev?: string;
  strategy?: 'lww' | 'manual';
  message?: string;
  recordedAt: string;
}

export interface SyncBindingStatus {
  cursor: string | null;
  lastSyncAt: string | null;
  pendingPush: number;
}

export interface SyncStatusSummary {
  lastSyncAt: string | null;
  pendingPush: number;
  conflicts: number;
  bindings: Record<string, SyncBindingStatus>;
}

export interface SyncRunOptions {
  bindingId?: string;
  direction?: SyncDirection;
}

export interface SyncRunResult {
  pushed: number;
  pulled: number;
  conflicts: SyncConflict[];
  errors: Array<{ path: string; message: string }>;
}

export interface SyncEngine {
  enqueuePush(op: SyncPushOperation): Promise<void>;
  getStatus(): Promise<SyncStatusSummary>;
  run(options?: SyncRunOptions): Promise<SyncRunResult>;
}

export type WorkspaceMode = 'unset' | 'local';
