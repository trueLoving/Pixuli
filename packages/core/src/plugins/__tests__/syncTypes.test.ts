import { describe, expect, it } from 'vitest';
import type { StorageProvider } from '../types';
import { hasStorageProviderPublicUrl, hasStorageProviderSync } from '../types';

describe('StorageProvider sync type guards', () => {
  const baseProvider = {
    manifest: {
      id: 'test',
      name: 'Test',
      version: '1',
      capabilities: {
        list: true,
        upload: true,
        delete: true,
        updateMetadata: true,
      },
    },
    configure: () => {},
    listImages: async () => [],
    uploadImage: async () => {
      throw new Error('not implemented');
    },
    deleteImage: async () => {},
    getRawUrl: () => '',
  } satisfies StorageProvider;

  it('hasStorageProviderSync is false for base provider', () => {
    expect(hasStorageProviderSync(baseProvider)).toBe(false);
  });

  it('hasStorageProviderSync is true when sync methods exist', () => {
    const withSync = {
      ...baseProvider,
      syncPull: async () => ({ items: [] }),
      syncPush: async () => {},
      getSyncCursor: async () => null,
    };
    expect(hasStorageProviderSync(withSync)).toBe(true);
  });

  it('hasStorageProviderPublicUrl detects buildPublicUrl', () => {
    expect(hasStorageProviderPublicUrl(baseProvider)).toBe(false);
    const withUrl = {
      ...baseProvider,
      buildPublicUrl: (path: string) => `https://example.com/${path}`,
      resolveLinkKind: () => 'remote-raw' as const,
    };
    expect(hasStorageProviderPublicUrl(withUrl)).toBe(true);
  });
});
