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
  /** 远端仓库挂载点（provider config.path / D3 configRoot） */
  configRoot: string;
  config: StorageProviderConfig;
}

export interface WorkspaceConfig {
  schemaVersion: number;
  workspaceId: string;
  displayName: string;
  createdAt: string;
  bindings: WorkspaceBinding[];
}

export type LocalAssetSyncState =
  | 'local-only'
  | 'synced'
  | 'pending-push'
  | 'conflict';

export interface LocalAssetIndexEntry {
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
  syncState?: LocalAssetSyncState;
  /** REF-511 #141 */
  captureMetadata?: ImageCaptureMetadata;
}

export interface LocalListOptions {
  bindingId?: string;
  includeDeleted?: boolean;
  search?: string;
  /**
   * 仅返回该目录下的条目（`dir/` 前缀）。
   * 空/未传表示不限目录。
   */
  pathPrefix?: string;
  /**
   * 为 true 时只含直接子文件（不含子文件夹内文件）。
   * pathPrefix 未传时表示工作区根本层；未设 shallow 则不限深度。
   */
  shallow?: boolean;
  /** 排序后跳过的条数（默认 0） */
  offset?: number;
  /**
   * 排序后最多返回的条数。
   * 未传表示不截断。总数见 `listPage().total`。
   */
  limit?: number;
}

export interface LocalListPage {
  entries: LocalAssetIndexEntry[];
  /** 截断前的匹配总数 */
  total: number;
}

export interface LocalVault {
  readonly adapter: WorkspaceAdapter;
  open(): Promise<void>;
  getConfig(): WorkspaceConfig;
  list(options?: LocalListOptions): Promise<LocalAssetIndexEntry[]>;
  /** 与 list 相同过滤，额外返回截断前总数 */
  listPage(options?: LocalListOptions): Promise<LocalListPage>;
  getByPath(relativePath: string): Promise<LocalAssetIndexEntry | null>;
  importFile(
    source: File | string,
    targetRelativePath: string,
    meta?: Partial<LocalAssetIndexEntry>,
  ): Promise<LocalAssetIndexEntry>;
  updateMetadata(
    relativePath: string,
    patch: Partial<Pick<LocalAssetIndexEntry, 'name' | 'tags' | 'description'>>,
    options?: { skipPendingPush?: boolean },
  ): Promise<LocalAssetIndexEntry>;
  softDelete(relativePath: string): Promise<void>;
  /** 从索引移除并删除磁盘文件（同步路径归并等内部用途） */
  removeEntry(relativePath: string): Promise<void>;
  /** 列出已登记的空文件夹（及有文件的祖先由 index 派生） */
  listFolders(): Promise<string[]>;
  /** 新建空文件夹（仅本地） */
  createFolder(relativeDir: string): Promise<void>;
  /** 重命名/移动文件夹：更新空文件夹登记与 index 内相对路径（仅本地） */
  renameFolder(fromDir: string, toDir: string): Promise<number>;
  /** 删除文件夹：软删其下文件并移除空文件夹登记（仅本地） */
  deleteFolder(relativeDir: string): Promise<number>;
  /** 移动单个文件到目标目录（更新 relativePath，仅本地） */
  moveFile(
    relativePath: string,
    targetDir: string,
  ): Promise<LocalAssetIndexEntry>;
  scan(): Promise<number>;
  updateSyncMeta(
    relativePath: string,
    patch: Partial<
      Pick<LocalAssetIndexEntry, 'syncState' | 'remotePath' | 'bindingId'>
    >,
  ): Promise<LocalAssetIndexEntry>;
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
  treeRevision: string | null;
  dirtyFolders: string[];
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
  /** 为 true 时推送全部未删除条目并覆盖远端。默认只推本地变更。 */
  overwriteRemote?: boolean;
  /**
   * pull 协商后立刻拉取的文件夹（工作区相对路径；`""` 为根层）。
   * 未传时默认拉根层；其余脏夹留给 syncFolder 懒加载。
   */
  pathPrefix?: string;
}

export interface SyncRunResult {
  pushed: number;
  pulled: number;
  conflicts: SyncConflict[];
  errors: Array<{ path: string; message: string }>;
  /** 协商后仍脏、待进夹再拉的目录 */
  dirtyFolders?: string[];
  skipped?: boolean;
  /** resetToRemote 时清除的本地独有条目数 */
  removed?: number;
  /**
   * 推送前发现远端 sync-tree 已相对本地上次同步前进。
   * 为 true 时不应推送，需先拉取。
   */
  remoteAhead?: boolean;
}

export interface SyncEngine {
  enqueuePush(op: SyncPushOperation): Promise<void>;
  getStatus(bindingId?: string): Promise<SyncStatusSummary>;
  run(options?: SyncRunOptions): Promise<SyncRunResult>;
  /** 拉取或推送单个文件夹（懒加载 / 局部同步） */
  syncFolder(
    folderPath: string,
    options?: { bindingId?: string; direction?: 'pull' | 'push' },
  ): Promise<SyncRunResult>;
  listDirtyFolders(bindingId?: string): Promise<string[]>;
  /**
   * 整库恢复到与远端一致（远端为检查点）。
   * 强制全量拉取并覆盖本地，删除远端没有的本地条目，清空推送队列与冲突。
   */
  resetToRemote(options?: { bindingId?: string }): Promise<SyncRunResult>;
}

export type WorkspaceMode = 'unset' | 'local';
