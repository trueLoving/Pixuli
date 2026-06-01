import type {
  GitHubConfig,
  ImageItem,
  ImageUploadData,
} from '@pixuli/core/types';
import type { StorageProviderConfig } from '@pixuli/core/plugins';
import {
  DefaultPlatformAdapter,
  type PlatformAdapter,
} from '@pixuli/core/platform';
import { GitHubStorageProvider } from './githubStorageProvider';

/**
 * 兼容 pixuli-common 构造方式，供 REF-304 前 apps 继续使用。
 */
export class GitHubStorageService {
  private readonly provider: GitHubStorageProvider;

  constructor(
    config: GitHubConfig,
    options: {
      platform: 'web' | 'desktop' | 'mobile';
      platformAdapter?: PlatformAdapter;
    } = {
      platform: 'web',
      platformAdapter: new DefaultPlatformAdapter(),
    },
  ) {
    this.provider = new GitHubStorageProvider({
      platform: options.platform ?? 'web',
      platformAdapter: options.platformAdapter ?? new DefaultPlatformAdapter(),
    });
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
    metadata: Partial<Pick<ImageItem, 'name' | 'description' | 'tags'>>,
  ): Promise<void> {
    return this.provider.updateImageInfo(imageId, fileName, metadata);
  }

  loadImageMetadata(
    images: ImageItem[],
    options?: Parameters<GitHubStorageProvider['loadImageMetadata']>[1],
  ): Promise<ImageItem[]> {
    return this.provider.loadImageMetadata(images, options);
  }
}
