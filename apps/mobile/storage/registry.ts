import {
  createStoragePluginRegistry,
  isStoragePluginRegistered as isPluginRegisteredOnRegistry,
  type StoragePluginManifest,
} from '@pixuli/core/plugins';
import { registerGitHubProvider } from '@pixuli/provider-github/register';
import { registerGiteeProvider } from '@pixuli/provider-gitee/register';

export const storageRegistry = createStoragePluginRegistry();

let bootstrapped = false;

export function bootstrapStorageProviders(): void {
  if (bootstrapped) {
    return;
  }
  registerGitHubProvider(storageRegistry);
  registerGiteeProvider(storageRegistry);
  bootstrapped = true;
}

bootstrapStorageProviders();

export function listStoragePluginManifests(): StoragePluginManifest[] {
  return storageRegistry.listManifests();
}

export function isStoragePluginRegistered(pluginId: string): boolean {
  return isPluginRegisteredOnRegistry(storageRegistry, pluginId);
}
