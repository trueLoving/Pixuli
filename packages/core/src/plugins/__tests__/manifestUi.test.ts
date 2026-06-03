import { describe, expect, it } from 'vitest';
import { createStoragePluginRegistry } from '../registry';
import type { StoragePluginManifest } from '../types';
import {
  getManifestDescription,
  getStoragePluginDisplayName,
  isKnownBuiltinPluginId,
  isStoragePluginRegistered,
} from '../manifestUi';

const testManifest: StoragePluginManifest = {
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

describe('manifestUi', () => {
  it('isStoragePluginRegistered and getStoragePluginDisplayName', () => {
    const registry = createStoragePluginRegistry();
    registry.register(testManifest, () => ({}) as never);
    expect(isStoragePluginRegistered(registry, 'github')).toBe(true);
    expect(isStoragePluginRegistered(registry, 'unknown')).toBe(false);
    expect(getStoragePluginDisplayName(registry, 'github')).toBe('GitHub');
    expect(getStoragePluginDisplayName(registry, 'unknown')).toBe('unknown');
  });

  it('getManifestDescription prefers translate', () => {
    const desc = getManifestDescription(testManifest, key =>
      key === 'sidebar.githubDescription' ? 'GitHub 仓库' : key,
    );
    expect(desc).toBe('GitHub 仓库');
  });

  it('isKnownBuiltinPluginId', () => {
    expect(isKnownBuiltinPluginId('github')).toBe(true);
    expect(isKnownBuiltinPluginId('custom')).toBe(false);
  });
});
