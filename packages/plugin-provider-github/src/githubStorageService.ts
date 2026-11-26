import type { AssetItem, AssetUploadData } from '@pixuli/core/types';
import type { GitHubConfig } from './types';
import type { StorageProviderConfig } from '@pixuli/core/plugins';
import {
  DefaultPlatformAdapter,
  type PlatformAdapter,
} from '@pixuli/core/platform';
import { GitHubStorageProvider } from './githubStorageProvider';

/**
 * 兼容层：委托 GitHubStorageProvider，供过渡期直接 new 使用。
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
    metadata: Partial<Pick<AssetItem, 'name' | 'description' | 'tags'>>,
  ): Promise<void> {
    return this.provider.updateImageInfo(imageId, fileName, metadata);
  }

  loadAssetMetadata(
    images: AssetItem[],
    options?: Parameters<GitHubStorageProvider['loadAssetMetadata']>[1],
  ): Promise<AssetItem[]> {
    return this.provider.loadAssetMetadata(images, options);
  }
}
