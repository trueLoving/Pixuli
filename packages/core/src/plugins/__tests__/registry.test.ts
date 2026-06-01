import { describe, expect, it, vi } from 'vitest';
import type { PlatformAdapter } from '../../platform/platformAdapter';
import {
  createStoragePluginRegistry,
  StoragePluginAlreadyRegisteredError,
} from '../registry';
import type {
  ProviderContext,
  StoragePluginManifest,
  StorageProvider,
} from '../types';

const stubAdapter = {} as PlatformAdapter;

const ctx: ProviderContext = {
  platform: 'web',
  platformAdapter: stubAdapter,
};

const githubManifest: StoragePluginManifest = {
  id: 'github',
  name: 'GitHub',
  version: '1.0.0',
  capabilities: {
    list: true,
    upload: true,
    delete: true,
    updateMetadata: true,
  },
};

function createStubProvider(manifest: StoragePluginManifest): StorageProvider {
  return {
    manifest,
    configure: vi.fn(),
    listImages: vi.fn().mockResolvedValue([]),
    uploadImage: vi.fn(),
    deleteImage: vi.fn(),
    getRawUrl: vi.fn().mockReturnValue(''),
  };
}

describe('DefaultStoragePluginRegistry', () => {
  it('registers a plugin and lists its manifest', () => {
    const registry = createStoragePluginRegistry();
    registry.register(githubManifest, () => createStubProvider(githubManifest));

    expect(registry.listManifests()).toEqual([githubManifest]);
    expect(registry.getManifest('github')).toEqual(githubManifest);
    expect(registry.get('github')).toBeTypeOf('function');
  });

  it('creates a provider without calling configure', () => {
    const registry = createStoragePluginRegistry();
    const factory = vi.fn(() => createStubProvider(githubManifest));
    registry.register(githubManifest, factory);

    const provider = registry.create('github', ctx);

    expect(factory).toHaveBeenCalledWith(ctx);
    expect(provider.manifest).toEqual(githubManifest);
    expect(provider.configure).not.toHaveBeenCalled();
  });

  it('throws when registering duplicate plugin id', () => {
    const registry = createStoragePluginRegistry();
    registry.register(githubManifest, () => createStubProvider(githubManifest));

    expect(() =>
      registry.register(githubManifest, () =>
        createStubProvider(githubManifest),
      ),
    ).toThrow(StoragePluginAlreadyRegisteredError);
  });

  it('throws when creating unregistered plugin', () => {
    const registry = createStoragePluginRegistry();

    expect(() => registry.create('missing', ctx)).toThrow(
      'Storage plugin not registered: missing',
    );
  });
});
