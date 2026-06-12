import type { ImageItem, ImageUploadData, LinkKind } from '../types/image';
import type { PlatformAdapter } from '../platform/platformAdapter';

export interface StorageCapabilities {
  list: boolean;
  upload: boolean;
  delete: boolean;
  updateMetadata: boolean;
  needsProxy?: boolean;
  maxUploadBytes?: number;
  /** REF-607：支持 syncPull / syncPush */
  sync?: boolean;
  /** REF-607：支持 buildPublicUrl / resolveLinkKind */
  publicUrl?: boolean;
}

/** 插件需在宿主环境挂载的集成点（REF-411） */
export type HostIntegrationKind =
  | 'viteDevServer'
  | 'electronMain'
  | 'electronPreload'
  | 'serverless';

/**
 * 由 Host Bootstrap 动态加载的集成声明。
 * `module` 为 package exports 子路径；`exportName` 为命名导出。
 */
export interface HostIntegrationDescriptor {
  kind: HostIntegrationKind;
  module: string;
  exportName: string;
}

export interface StoragePluginManifest {
  id: string;
  name: string;
  version: string;
  icon?: string;
  configSchema?: Record<string, unknown>;
  capabilities: StorageCapabilities;
  /** REF-411：Vite / Electron / Serverless 宿主集成声明 */
  hostIntegrations?: HostIntegrationDescriptor[];
}

export type StorageProviderConfig = Record<string, unknown>;

export interface ConfigValidationResult {
  ok: boolean;
  message?: string;
}

export interface ImageListOptions {
  path?: string;
  page?: number;
  pageSize?: number;
  recursive?: boolean;
}

export interface ImageMetadataLoadOptions {
  forceRefresh?: boolean;
  backgroundUpdate?: boolean;
}

/**
 * 存储 Provider 最小契约。须先 `configure(config)` 再调用 list/upload/delete 等方法。
 */
export interface StorageProvider {
  readonly manifest: StoragePluginManifest;
  configure(config: StorageProviderConfig): void | Promise<void>;
  validateConfig?(
    config: StorageProviderConfig,
  ): Promise<ConfigValidationResult>;
  listImages(options?: ImageListOptions): Promise<ImageItem[]>;
  uploadImage(data: ImageUploadData): Promise<ImageItem>;
  deleteImage(path: string): Promise<void>;
  updateImageMetadata?(
    path: string,
    metadata: Partial<Pick<ImageItem, 'name' | 'description' | 'tags'>>,
  ): Promise<ImageItem>;
  getRawUrl(path: string): string;
}

/**
 * 可选扩展：Mobile 等场景懒加载 sidecar 元数据。REF-302 在 provider 包内实现。
 */
export interface StorageProviderWithMetadata extends StorageProvider {
  loadImageMetadata(
    images: ImageItem[],
    options?: ImageMetadataLoadOptions,
  ): Promise<ImageItem[]>;
}

/** REF-607：远端同步拉取 */
export interface SyncPullOptions {
  since?: string;
  pathPrefix?: string;
}

export interface SyncPullResult {
  items: Array<{
    remotePath: string;
    action: 'add' | 'update' | 'delete';
    contentHash?: string;
    metadata?: Partial<ImageItem>;
  }>;
  nextCursor?: string;
}

export interface SyncPushItem {
  localRelativePath: string;
  remotePath: string;
  action: 'upload' | 'delete' | 'metadata';
  file?: Uint8Array;
  metadata?: Partial<ImageItem>;
}

export interface StorageProviderSync {
  syncPull(options?: SyncPullOptions): Promise<SyncPullResult>;
  syncPush(items: SyncPushItem[]): Promise<void>;
  getSyncCursor(): Promise<string | null>;
}

export type { LinkKind };

export interface StorageProviderPublicUrl {
  buildPublicUrl(remotePath: string): string;
  resolveLinkKind(url: string): LinkKind;
}

export interface StorageProviderWithSync
  extends StorageProvider,
    StorageProviderSync,
    StorageProviderPublicUrl {}

export function hasStorageProviderSync(
  provider: StorageProvider,
): provider is StorageProvider & StorageProviderSync {
  const candidate = provider as Partial<StorageProviderSync>;
  return (
    typeof candidate.syncPull === 'function' &&
    typeof candidate.syncPush === 'function' &&
    typeof candidate.getSyncCursor === 'function'
  );
}

export function hasStorageProviderPublicUrl(
  provider: StorageProvider,
): provider is StorageProvider & StorageProviderPublicUrl {
  const candidate = provider as Partial<StorageProviderPublicUrl>;
  return (
    typeof candidate.buildPublicUrl === 'function' &&
    typeof candidate.resolveLinkKind === 'function'
  );
}

/** M3 后期（REF-306）持久化的单条仓库源 */
export interface StoredSourceEntry {
  id: string;
  label: string;
  pluginId: string;
  config: StorageProviderConfig;
  createdAt: number;
  updatedAt: number;
}

export type StorageProviderFactory = (ctx: ProviderContext) => StorageProvider;

export interface ProviderContext {
  platform: 'web' | 'desktop' | 'mobile';
  platformAdapter: PlatformAdapter;
  logger?: Pick<Console, 'log' | 'warn' | 'error'>;
  fetch?: typeof fetch;
}

export interface StoragePluginRegistry {
  register(
    manifest: StoragePluginManifest,
    factory: StorageProviderFactory,
  ): void;
  get(id: string): StorageProviderFactory | undefined;
  getManifest(id: string): StoragePluginManifest | undefined;
  listManifests(): StoragePluginManifest[];
  create(id: string, ctx: ProviderContext): StorageProvider;
}

export class StoragePluginAlreadyRegisteredError extends Error {
  readonly pluginId: string;

  constructor(pluginId: string) {
    super(`Storage plugin already registered: ${pluginId}`);
    this.name = 'StoragePluginAlreadyRegisteredError';
    this.pluginId = pluginId;
  }
}
