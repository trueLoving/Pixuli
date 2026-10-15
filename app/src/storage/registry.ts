import {
  createStoragePluginRegistry,
  isStoragePluginRegistered as isPluginRegisteredOnRegistry,
  type StoragePluginManifest,
} from '@pixuli/core/plugins';
import { registerGitHubProvider } from '@pixuli/provider-github/register';
import { registerOneDriveProvider } from '@pixuli/provider-onedrive/register';
import { registerPixuliGiteeProvider } from './registerGiteeProvider';

export const storageRegistry = createStoragePluginRegistry();

let bootstrapped = false;

export function bootstrapStorageProviders(): void {
  if (bootstrapped) {
    return;
  }
  registerGitHubProvider(storageRegistry);
  registerPixuliGiteeProvider(storageRegistry);
  registerOneDriveProvider(storageRegistry);
  bootstrapped = true;
}

bootstrapStorageProviders();

/** 暂时不在「添加连接」里展示。插件仍注册，已保存的源可以继续同步。 */
const HIDDEN_CONNECTION_PLUGIN_IDS = new Set(['onedrive']);

export function listStoragePluginManifests(): StoragePluginManifest[] {
  return storageRegistry
    .listManifests()
    .filter(manifest => !HIDDEN_CONNECTION_PLUGIN_IDS.has(manifest.id));
}

export function isStoragePluginRegistered(pluginId: string): boolean {
  return isPluginRegisteredOnRegistry(storageRegistry, pluginId);
}
