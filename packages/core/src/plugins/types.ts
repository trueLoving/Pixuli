import type { ImageItem, ImageUploadData } from '../types/image';
import type { PlatformAdapter } from '../platform/platformAdapter';

export interface StorageCapabilities {
  list: boolean;
  upload: boolean;
  delete: boolean;
  updateMetadata: boolean;
  needsProxy?: boolean;
  maxUploadBytes?: number;
}

export interface StoragePluginManifest {
  id: string;
  name: string;
  version: string;
  icon?: string;
  configSchema?: Record<string, unknown>;
  capabilities: StorageCapabilities;
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
