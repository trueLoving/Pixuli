import type { GiteeConfig, GitHubConfig } from '@pixuli/core/types';
import type {
  StorageProvider,
  StorageProviderConfig,
} from '@pixuli/core/plugins';
import { DefaultPlatformAdapter } from '@pixuli/core/platform';
import {
  getStoragePluginDisplayName,
  isKnownBuiltinPluginId,
} from '@pixuli/core/plugins';
import { getGiteeProviderContextFields } from '@pixuli/provider-gitee/proxy/client';
import { isNativeMobile } from '../utils/platform';
import { storageRegistry } from './registry';

export type StoragePluginId = 'github' | 'gitee';

export function getAppPlatform(): 'web' | 'desktop' {
  return __IS_WEB__ ? 'web' : 'desktop';
}

/** Capacitor 壳内无同源 /api；可经 VITE_GITEE_PROXY_ORIGIN 指向已部署 Web 代理 */
function resolveGiteeProviderContextFields(): { giteeProxyBase?: string } {
  if (isNativeMobile()) {
    const origin = import.meta.env.VITE_GITEE_PROXY_ORIGIN?.trim();
    if (origin) {
      return { giteeProxyBase: origin.replace(/\/$/, '') };
    }
  }
  return getGiteeProviderContextFields(__IS_WEB__);
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
    ...resolveGiteeProviderContextFields(),
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
