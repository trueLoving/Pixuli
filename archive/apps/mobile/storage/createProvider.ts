import type { GiteeConfig, GitHubConfig } from '@pixuli/core/types';
import type {
  StorageProvider,
  StorageProviderConfig,
  StorageProviderWithMetadata,
} from '@pixuli/core/plugins';
import { DefaultPlatformAdapter } from '@pixuli/core/platform';
import {
  getStoragePluginDisplayName,
  isKnownBuiltinPluginId,
} from '@pixuli/core/plugins';
import { storageRegistry } from './registry';

export type StoragePluginId = 'github' | 'gitee';

export function createConfiguredStorageProvider(
  pluginId: string,
  config: GitHubConfig | GiteeConfig,
): StorageProvider {
  if (!isKnownBuiltinPluginId(pluginId)) {
    throw new Error(`Unsupported storage plugin: ${pluginId}`);
  }
  const provider = storageRegistry.create(pluginId, {
    platform: 'mobile',
    platformAdapter: new DefaultPlatformAdapter(),
  });
  provider.configure(config as unknown as StorageProviderConfig);
  return provider;
}

export function storagePluginLabel(pluginId: string | null): string {
  if (!pluginId) {
    return '存储';
  }
  return getStoragePluginDisplayName(storageRegistry, pluginId);
}

export function hasLoadImageMetadata(
  provider: StorageProvider,
): provider is StorageProviderWithMetadata {
  return (
    typeof (provider as StorageProviderWithMetadata).loadImageMetadata ===
    'function'
  );
}
