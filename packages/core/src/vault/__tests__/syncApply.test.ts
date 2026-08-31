import { describe, expect, it, vi } from 'vitest';
import { createLocalVault } from '../localVault';
import { MemoryWorkspaceAdapter } from '../memoryAdapter';
import {
  applySyncPull,
  buildSyncPushItems,
  resolveLocalPathForPull,
  resolveRemotePathForPush,
} from '../syncApply';
import { isSyncExcludedPath } from '../syncPath';
import type { StorageProvider } from '../../plugins/types';

function createMockProvider(
  overrides: Partial<StorageProvider> = {},
): StorageProvider {
  return {
    manifest: {
      id: 'mock',
      name: 'Mock',
      version: '1.0.0',
      capabilities: { list: true, upload: true, delete: true, sync: true },
    },
    configure: () => undefined,
    listImages: async () => [],
    uploadImage: async () => {
      throw new Error('not used');
    },
    deleteImage: async () => undefined,
    getRawUrl: (path: string) => `https://example.test/${path}`,
    ...overrides,
  } as StorageProvider;
}

describe('syncPath', () => {
  it('excludes .pixuli paths from sync', () => {
    expect(isSyncExcludedPath('.pixuli/config.json')).toBe(true);
    expect(isSyncExcludedPath('images/a.jpg')).toBe(false);
  });
});

describe('syncApply (configRoot 1:1)', () => {
  it('resolveRemotePathForPush mirrors workspace relative path', async () => {
    const adapter = new MemoryWorkspaceAdapter('desktop');
    await adapter.pickRoot();
    const vault = createLocalVault(adapter);
    await vault.open();
    await vault.importFile(new Uint8Array([1]), 'images/trip/photo.jpg', {
      name: 'photo.jpg',
      syncState: 'local-only',
    });
    const entry = await vault.getByPath('images/trip/photo.jpg');
    expect(resolveRemotePathForPush(entry!)).toBe('images/trip/photo.jpg');
    expect(resolveLocalPathForPull('video/1.mp4')).toBe('video/1.mp4');
  });

  it('resolveRemotePathForPush returns null for .pixuli', async () => {
    const adapter = new MemoryWorkspaceAdapter('desktop');
    await adapter.pickRoot();
    const vault = createLocalVault(adapter);
    await vault.open();
    await vault.importFile(new Uint8Array([1]), '.pixuli/config.json', {
      syncState: 'local-only',
    });
    const entry = await vault.getByPath('.pixuli/config.json');
    expect(resolveRemotePathForPush(entry!)).toBeNull();
  });

  it('buildSyncPushItems uses workspace relative path as remotePath', async () => {
    const adapter = new MemoryWorkspaceAdapter('desktop');
    await adapter.pickRoot();
    const vault = createLocalVault(adapter);
    await vault.open();
    await vault.importFile(
      new Uint8Array([1, 2]),
      'images/1787193114444-Readuli.png',
      {
        name: 'Readuli.png',
        mimeType: 'image/png',
      },
    );

    const items = await buildSyncPushItems(
      vault,
      'binding-1',
      ['images/1787193114444-Readuli.png'],
      async () => new Uint8Array([1, 2]),
    );

    expect(items[0]?.remotePath).toBe('images/1787193114444-Readuli.png');
  });

  it('pull writes files to the same workspace relative path', async () => {
    const adapter = new MemoryWorkspaceAdapter('desktop');
    await adapter.pickRoot();
    const vault = createLocalVault(adapter);
    await vault.open();

    const remoteBytes = new Uint8Array([5, 5, 5]);
    const provider = createMockProvider();
    const fetchFn = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => remoteBytes.buffer,
    })) as unknown as typeof fetch;

    const result = await applySyncPull(
      vault,
      'binding-1',
      {
        items: [
          {
            remotePath: 'images/trip/photo.jpg',
            action: 'update',
            metadata: {
              name: 'photo.jpg',
              updatedAt: new Date().toISOString(),
              url: 'https://example.test/images/trip/photo.jpg',
            },
          },
        ],
      },
      provider,
      { fetchFn },
    );

    expect(result.pulled).toBe(1);
    const entry = await vault.getByPath('images/trip/photo.jpg');
    expect(entry?.remotePath).toBe('images/trip/photo.jpg');
    expect(entry?.syncState).toBe('synced');
  });

  it('pull skips already synced remote file', async () => {
    const adapter = new MemoryWorkspaceAdapter('desktop');
    await adapter.pickRoot();
    const vault = createLocalVault(adapter);
    await vault.open();

    const remoteUpdatedAt = '2026-08-20T02:00:00.000Z';
    await vault.importFile(new Uint8Array([1]), 'images/Readuli.png', {
      name: 'Readuli.png',
      syncState: 'synced',
      remotePath: 'images/Readuli.png',
      bindingId: 'binding-1',
      updatedAt: remoteUpdatedAt,
    });

    const fetchFn = vi.fn();
    const result = await applySyncPull(
      vault,
      'binding-1',
      {
        items: [
          {
            remotePath: 'images/Readuli.png',
            action: 'update',
            metadata: {
              name: 'Readuli.png',
              updatedAt: remoteUpdatedAt,
            },
          },
        ],
      },
      createMockProvider(),
      { fetchFn },
    );

    expect(result.pulled).toBe(0);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('pull overwrites local-only changes when remote is older', async () => {
    const adapter = new MemoryWorkspaceAdapter('desktop');
    await adapter.pickRoot();
    const vault = createLocalVault(adapter);
    await vault.open();

    const remoteBytes = new Uint8Array([7, 7, 7]);
    await vault.importFile(new Uint8Array([1, 1, 1]), 'images/Readuli.png', {
      name: 'Readuli.png',
      syncState: 'local-only',
      bindingId: 'binding-1',
      updatedAt: '2026-08-20T10:00:00.000Z',
    });

    const fetchFn = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => remoteBytes.buffer,
    })) as unknown as typeof fetch;

    const result = await applySyncPull(
      vault,
      'binding-1',
      {
        items: [
          {
            remotePath: 'images/Readuli.png',
            action: 'update',
            metadata: {
              name: 'Readuli.png',
              updatedAt: '2026-08-20T02:00:00.000Z',
              url: 'https://example.test/images/Readuli.png',
            },
          },
        ],
      },
      createMockProvider(),
      { fetchFn },
    );

    expect(result.pulled).toBe(1);
    expect(fetchFn).toHaveBeenCalledOnce();
    const data = await adapter.readFile('images/Readuli.png');
    expect(Array.from(data)).toEqual([7, 7, 7]);
  });

  it('pull creates file at exact remote path without merging unrelated local paths', async () => {
    const adapter = new MemoryWorkspaceAdapter('desktop');
    await adapter.pickRoot();
    const vault = createLocalVault(adapter);
    await vault.open();

    const remoteBytes = new Uint8Array([3, 3, 3]);
    await vault.importFile(
      new Uint8Array([1, 1]),
      '111/1787193114444-Omnivuli.png',
      {
        name: 'Omnivuli.png',
        mimeType: 'image/png',
        syncState: 'local-only',
      },
    );

    const fetchFn = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => remoteBytes.buffer,
    })) as unknown as typeof fetch;

    const result = await applySyncPull(
      vault,
      'binding-1',
      {
        items: [
          {
            remotePath: '111/Omnivuli.png',
            action: 'update',
            metadata: {
              name: 'Omnivuli.png',
              updatedAt: new Date().toISOString(),
              url: 'https://example.test/111/Omnivuli.png',
            },
          },
        ],
      },
      createMockProvider(),
      { fetchFn },
    );

    expect(result.pulled).toBe(1);
    const listed = await vault.list();
    expect(listed.some(item => item.relativePath === '111/Omnivuli.png')).toBe(
      true,
    );
    expect(await adapter.exists('111/Omnivuli.png')).toBe(true);
  });
});
