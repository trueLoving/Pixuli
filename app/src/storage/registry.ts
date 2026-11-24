import {
  isStoragePluginRegistered as isPluginRegisteredOnRegistry,
  type StoragePluginManifest,
} from '@pixuli/core/plugins';
import { startPluginRuntime, storageRegistry } from '@/plugins/runtime';

export { storageRegistry };

/** 确保 Builtin Runtime 已 start（幂等） */
startPluginRuntime();

export function listStoragePluginManifests(): StoragePluginManifest[] {
  return storageRegistry.listManifests();
}

export function isStoragePluginRegistered(pluginId: string): boolean {
  return isPluginRegisteredOnRegistry(storageRegistry, pluginId);
}
