import { describe, expect, it } from 'vitest';
import { createStoragePluginRegistry } from '@pixuli/core/plugins';
import { registerOneDriveProvider, onedriveManifest } from '../register';
import { OneDriveStorageProvider } from '../onedriveStorageProvider';

describe('registerOneDriveProvider', () => {
  it('registers onedrive manifest and creates provider', () => {
    const registry = createStoragePluginRegistry();
    registerOneDriveProvider(registry);

    expect(registry.listManifests()).toEqual([onedriveManifest]);
    const provider = registry.create('onedrive', {
      platform: 'web',
      platformAdapter: {} as never,
    });
    expect(provider).toBeInstanceOf(OneDriveStorageProvider);
    expect(provider.manifest.id).toBe('onedrive');
    expect(provider.manifest.auth?.modes).toEqual(['oauthBrowser']);
  });

  it('throws when registering onedrive twice', () => {
    const registry = createStoragePluginRegistry();
    registerOneDriveProvider(registry);
    expect(() => registerOneDriveProvider(registry)).toThrow(
      'Storage plugin already registered: onedrive',
    );
  });
});
