import type { AssetItem, AssetUploadData } from '@pixuli/core/types';
import type { GiteeConfig } from './types';
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
    } = {
      platform: 'web',
      platformAdapter: new DefaultPlatformAdapter(),
    },
  ) {
    this.provider = new GiteeStorageProvider({
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

  uploadAsset(uploadData: AssetUploadData): Promise<AssetItem> {
    return this.provider.uploadAsset(uploadData);
  }

  deleteAsset(_imageId: string, fileName: string): Promise<void> {
    return this.provider.deleteAsset(fileName);
  }

  getImageList(): Promise<AssetItem[]> {
    return this.provider.listAssets();
  }

  updateImageInfo(
    imageId: string,
    fileName: string,
    metadata: Parameters<GiteeStorageProvider['updateImageInfo']>[2],
  ): Promise<void> {
    return this.provider.updateImageInfo(imageId, fileName, metadata);
  }

  loadAssetMetadata(
    images: AssetItem[],
    options?: Parameters<GiteeStorageProvider['loadAssetMetadata']>[1],
  ): Promise<AssetItem[]> {
    return this.provider.loadAssetMetadata(images, options);
  }
}
