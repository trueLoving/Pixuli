import { describe, expect, it, vi } from 'vitest';
import { createLocalVault } from '../localVault';
import { MemoryWorkspaceAdapter } from '../memoryAdapter';
import {
  applySyncPull,
  buildSyncPushItems,
  resolveRemotePathForPush,
} from '../syncApply';
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

describe('syncApply', () => {
  it('resolveRemotePathForPush prefers display name over timestamp local path', async () => {
    const adapter = new MemoryWorkspaceAdapter('desktop');
    await adapter.pickRoot();
    const vault = createLocalVault(adapter);
    await vault.open();
    await vault.importFile(
      new Uint8Array([1]),
      'images/1787193114444-Readuli.png',
      {
        name: 'Readuli.png',
        syncState: 'local-only',
      },
    );
    const entry = await vault.getByPath('images/1787193114444-Readuli.png');
    expect(entry).toBeTruthy();
    expect(resolveRemotePathForPush(entry!)).toBe('Readuli.png');
  });

  it('buildSyncPushItems uses display name as remotePath', async () => {
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

    expect(items[0]?.remotePath).toBe('Readuli.png');
  });

  it('pull reconciles timestamp local path to canonical remote filename', async () => {
    const adapter = new MemoryWorkspaceAdapter('desktop');
    await adapter.pickRoot();
    const vault = createLocalVault(adapter);
    await vault.open();

    const remoteBytes = new Uint8Array([9, 9, 9]);
    await vault.importFile(remoteBytes, 'images/1787193114444-Readuli.png', {
      name: 'Readuli.png',
      mimeType: 'image/png',
      syncState: 'synced',
      remotePath: '1787193114444-Readuli.png',
      bindingId: 'binding-1',
    });

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
            remotePath: 'Readuli.png',
            action: 'update',
            metadata: {
              name: 'Readuli.png',
              updatedAt: new Date().toISOString(),
              url: 'https://example.test/Readuli.png',
            },
          },
        ],
      },
      provider,
      { fetchFn },
    );

    expect(result.pulled).toBe(1);
    expect(result.conflicts).toHaveLength(0);

    const listed = await vault.list();
    expect(listed).toHaveLength(1);
    expect(listed[0].relativePath).toBe('images/Readuli.png');
    expect(listed[0].remotePath).toBe('Readuli.png');
    expect(listed[0].name).toBe('Readuli.png');
    expect(await adapter.exists('images/1787193114444-Readuli.png')).toBe(
      false,
    );
    expect(await adapter.exists('images/Readuli.png')).toBe(true);
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
      remotePath: 'Readuli.png',
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
            remotePath: 'Readuli.png',
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
            remotePath: 'Readuli.png',
            action: 'update',
            metadata: {
              name: 'Readuli.png',
              updatedAt: '2026-08-20T02:00:00.000Z',
              url: 'https://example.test/Readuli.png',
            },
          },
        ],
      },
      createMockProvider(),
      { fetchFn },
    );

    expect(result.pulled).toBe(1);
    expect(result.conflicts).toHaveLength(0);
    expect(fetchFn).toHaveBeenCalledOnce();

    const data = await adapter.readFile('images/Readuli.png');
    expect(Array.from(data)).toEqual([7, 7, 7]);
    const entry = await vault.getByPath('images/Readuli.png');
    expect(entry?.syncState).toBe('synced');
  });
});
