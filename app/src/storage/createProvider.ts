import type {
  StorageProvider,
  StorageProviderConfig,
  StorageProviderDiscovery,
} from '@pixuli/core/plugins';
import { DefaultPlatformAdapter } from '@pixuli/core/platform';
import {
  getStoragePluginDisplayName,
  hasStorageProviderDiscovery,
} from '@pixuli/core/plugins';
import { storageRegistry } from '@/plugins/registries';
import { startPluginRuntime } from '@/plugins/runtime';
import { isWeb } from '@/platforms/platform';

/** 已注册的 storage 插件 id（不再白名单写死） */
export type StoragePluginId = string;

export function getAppPlatform(): 'web' | 'desktop' {
  return isWeb() ? 'web' : 'desktop';
}

function assertStoragePluginRegistered(pluginId: string): void {
  startPluginRuntime();
  if (!storageRegistry.getManifest(pluginId)) {
    throw new Error(`Unsupported storage plugin: ${pluginId}`);
  }
}

export function createConfiguredStorageProvider(
  pluginId: string,
  config: StorageProviderConfig,
): StorageProvider {
  assertStoragePluginRegistered(pluginId);
  const provider = storageRegistry.create(pluginId, {
    platform: getAppPlatform(),
    platformAdapter: new DefaultPlatformAdapter(),
  });
  provider.configure(config);
  return provider;
}

export function createDiscoveryProvider(
  pluginId: string,
): StorageProvider & StorageProviderDiscovery {
  assertStoragePluginRegistered(pluginId);
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
