import type { GiteeConfig, GitHubConfig } from '@pixuli/core/types';
import type {
  StorageProvider,
  StorageProviderConfig,
  StorageProviderWithMetadata,
} from '@pixuli/core/plugins';
import { DefaultPlatformAdapter } from '@pixuli/core/platform';
import { storageRegistry } from './registry';

export type StoragePluginId = 'github' | 'gitee';

export function createConfiguredStorageProvider(
  pluginId: StoragePluginId,
  config: GitHubConfig | GiteeConfig,
): StorageProvider {
  const provider = storageRegistry.create(pluginId, {
    platform: 'mobile',
    platformAdapter: new DefaultPlatformAdapter(),
  });
  provider.configure(config as unknown as StorageProviderConfig);
  return provider;
}

export function storagePluginLabel(pluginId: StoragePluginId | null): string {
  return pluginId === 'gitee' ? 'Gitee' : 'GitHub';
}

export function hasLoadImageMetadata(
  provider: StorageProvider,
): provider is StorageProviderWithMetadata {
  return (
    typeof (provider as StorageProviderWithMetadata).loadImageMetadata ===
    'function'
  );
}
