import type {
  GiteeConfig,
  ImageItem,
  ImageUploadData,
} from '@pixuli/core/types';
import type { StorageProviderConfig } from '@pixuli/core/plugins';
import {
  DefaultPlatformAdapter,
  type PlatformAdapter,
} from '@pixuli/core/platform';
import { GiteeStorageProvider } from './giteeStorageProvider';

/**
 * 兼容层：委托 GiteeStorageProvider，供过渡期直接 new 使用。
 */
export class GiteeStorageService {
  private readonly provider: GiteeStorageProvider;

  constructor(
    config: GiteeConfig,
    options: {
      platform: 'web' | 'desktop' | 'mobile';
      platformAdapter?: PlatformAdapter;
      useProxy?: boolean;
    } = {
      platform: 'web',
      platformAdapter: new DefaultPlatformAdapter(),
      useProxy: false,
    },
  ) {
    this.provider = new GiteeStorageProvider(
      {
        platform: options.platform ?? 'web',
        platformAdapter:
          options.platformAdapter ?? new DefaultPlatformAdapter(),
      },
      { useProxy: options.useProxy ?? false },
    );
    this.provider.configure(config as unknown as StorageProviderConfig);
  }

  getImageDimensions(
    file: File | string,
  ): Promise<{ width: number; height: number }> {
    return this.provider.getImageDimensions(file);
  }

  uploadImage(uploadData: ImageUploadData): Promise<ImageItem> {
    return this.provider.uploadImage(uploadData);
  }

  deleteImage(_imageId: string, fileName: string): Promise<void> {
    return this.provider.deleteImage(fileName);
  }

  getImageList(): Promise<ImageItem[]> {
    return this.provider.listImages();
  }

  updateImageInfo(
    imageId: string,
    fileName: string,
    metadata: Parameters<GiteeStorageProvider['updateImageInfo']>[2],
  ): Promise<void> {
    return this.provider.updateImageInfo(imageId, fileName, metadata);
  }

  loadImageMetadata(
    images: ImageItem[],
    options?: Parameters<GiteeStorageProvider['loadImageMetadata']>[1],
  ): Promise<ImageItem[]> {
    return this.provider.loadImageMetadata(images, options);
  }
}
