import type { StoragePluginRegistry } from '@pixuli/core/plugins';
import { OneDriveStorageProvider } from './onedriveStorageProvider';
import { onedriveManifest } from './manifest';

export function registerOneDriveProvider(
  registry: StoragePluginRegistry,
): void {
  registry.register(onedriveManifest, ctx => new OneDriveStorageProvider(ctx));
}

export { onedriveManifest };
