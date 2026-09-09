import type { GiteeConfig, GitHubConfig } from '@pixuli/core/types';
import type {
  StorageProvider,
  StorageProviderConfig,
  StorageProviderDiscovery,
} from '@pixuli/core/plugins';
import { DefaultPlatformAdapter } from '@pixuli/core/platform';
import {
  getStoragePluginDisplayName,
  hasStorageProviderDiscovery,
  isKnownBuiltinPluginId,
} from '@pixuli/core/plugins';
import { isWeb } from '@/platforms/platform';
import { storageRegistry } from './registry';

export type StoragePluginId = 'github' | 'gitee';

export function getAppPlatform(): 'web' | 'desktop' {
  return isWeb() ? 'web' : 'desktop';
}

export function createConfiguredStorageProvider(
  pluginId: string,
  config: GitHubConfig | GiteeConfig,
): StorageProvider {
  if (!isKnownBuiltinPluginId(pluginId)) {
    throw new Error(`Unsupported storage plugin: ${pluginId}`);
  }
  const provider = storageRegistry.create(pluginId, {
    platform: getAppPlatform(),
    platformAdapter: new DefaultPlatformAdapter(),
  });
  provider.configure(config as unknown as StorageProviderConfig);
  return provider;
}

export function createDiscoveryProvider(
  pluginId: string,
): StorageProvider & StorageProviderDiscovery {
  if (!isKnownBuiltinPluginId(pluginId)) {
    throw new Error(`Unsupported storage plugin: ${pluginId}`);
  }
  const provider = storageRegistry.create(pluginId, {
    platform: getAppPlatform(),
    platformAdapter: new DefaultPlatformAdapter(),
  });
  if (!hasStorageProviderDiscovery(provider)) {
    throw new Error(
      `Storage plugin does not support token discovery: ${pluginId}`,
    );
  }
  return provider;
}

export function storagePluginLabel(pluginId: string | null): string {
  if (!pluginId) {
    return '存储';
  }
  return getStoragePluginDisplayName(storageRegistry, pluginId);
}
