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

export interface ImageListOptions {
  path?: string;
  page?: number;
  pageSize?: number;
  recursive?: boolean;
}

export interface StorageProvider {
  readonly manifest: StoragePluginManifest;
  configure(config: StorageProviderConfig): void | Promise<void>;
  validateConfig?(
    config: StorageProviderConfig,
  ): Promise<{ ok: boolean; message?: string }>;
  listImages(options?: ImageListOptions): Promise<ImageItem[]>;
  uploadImage(data: ImageUploadData): Promise<ImageItem>;
  deleteImage(path: string): Promise<void>;
  updateImageMetadata?(
    path: string,
    metadata: Partial<Pick<ImageItem, 'name' | 'description' | 'tags'>>,
  ): Promise<ImageItem>;
  getRawUrl(path: string): string;
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
  listManifests(): StoragePluginManifest[];
  create(id: string, ctx: ProviderContext): StorageProvider;
}
