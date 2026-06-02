import type { GiteeConfig, GitHubConfig } from '@pixuli/core/types';
import type {
  StorageProvider,
  StorageProviderConfig,
} from '@pixuli/core/plugins';
import { DefaultPlatformAdapter } from '@pixuli/core/platform';
import { storageRegistry } from './registry';

export type StoragePluginId = 'github' | 'gitee';

export function getAppPlatform(): 'web' | 'desktop' {
  return __IS_WEB__ ? 'web' : 'desktop';
}

export function createConfiguredStorageProvider(
  pluginId: StoragePluginId,
  config: GitHubConfig | GiteeConfig,
): StorageProvider {
  const provider = storageRegistry.create(pluginId, {
    platform: getAppPlatform(),
    platformAdapter: new DefaultPlatformAdapter(),
  });
  provider.configure(config as unknown as StorageProviderConfig);
  return provider;
}

export function storagePluginLabel(pluginId: StoragePluginId | null): string {
  return pluginId === 'gitee' ? 'Gitee' : 'GitHub';
}
