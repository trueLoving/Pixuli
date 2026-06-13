import { describe, expect, it, vi } from 'vitest';
import { createLocalVault } from '../localVault';
import { MemoryWorkspaceAdapter } from '../memoryAdapter';
import { createSyncEngine } from '../syncEngine';
import type { StorageProvider } from '../../plugins/types';

function createMockSyncProvider(
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
    syncPull: async () => ({ items: [], nextCursor: 'cursor-1' }),
    syncPush: async () => undefined,
    getSyncCursor: async () => null,
    ...overrides,
  } as StorageProvider;
}

async function createTestContext() {
  const adapter = new MemoryWorkspaceAdapter('desktop');
  await adapter.pickRoot();
  const vault = createLocalVault(adapter);
  await vault.open();
  const syncPush = vi.fn(async () => undefined);
  const provider = createMockSyncProvider({ syncPush });
  const engine = createSyncEngine({
    vault,
    getBindings: () => [{ bindingId: 'binding-1', provider }],
  });
  return { engine, vault, adapter, provider, syncPush };
}

describe('createSyncEngine', () => {
  it('tracks enqueuePush in status', async () => {
    const onEnqueue = vi.fn();
    const { engine } = await createTestContext();
    const tracked = createSyncEngine({
      vault: (await createTestContext()).vault,
      getBindings: () => [
        {
          bindingId: 'binding-1',
          provider: createMockSyncProvider(),
        },
      ],
      onEnqueue,
    });

    await tracked.enqueuePush({
      type: 'upload',
      relativePath: 'images/a.jpg',
    });
    expect(onEnqueue).toHaveBeenCalledOnce();

    const status = await tracked.getStatus();
    expect(status.pendingPush).toBeGreaterThanOrEqual(1);
    expect(status.conflicts).toBe(0);
  });

  it('run push flushes pending local entries', async () => {
    const { engine, vault, syncPush } = await createTestContext();
    const file = new File([new Uint8Array([1, 2, 3])], 'a.jpg', {
      type: 'image/jpeg',
    });
    await vault.importFile(file, 'images/a.jpg', { syncState: 'local-only' });

    const result = await engine.run({ direction: 'push' });
    expect(result.pushed).toBe(1);
    expect(syncPush).toHaveBeenCalledOnce();

    const entry = await vault.getByPath('images/a.jpg');
    expect(entry?.syncState).toBe('synced');
  });

  it('run pull applies remote items and updates cursor', async () => {
    const adapter = new MemoryWorkspaceAdapter('desktop');
    await adapter.pickRoot();
    const vault = createLocalVault(adapter);
    await vault.open();

    const remoteBytes = new Uint8Array([9, 9, 9]);
    const provider = createMockSyncProvider({
      syncPull: async () => ({
        items: [
          {
            remotePath: 'remote.jpg',
            action: 'add',
            contentHash: 'sha-remote',
            metadata: {
              name: 'remote.jpg',
              updatedAt: new Date().toISOString(),
              url: 'https://example.test/remote.jpg',
            },
          },
        ],
        nextCursor: 'cursor-2',
      }),
      getRawUrl: () => 'https://example.test/remote.jpg',
    });

    const fetchFn = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => remoteBytes.buffer,
    })) as unknown as typeof fetch;

    const engine = createSyncEngine({
      vault,
      getBindings: () => [{ bindingId: 'binding-1', provider }],
      fetch: fetchFn,
    });

    const result = await engine.run({ direction: 'pull' });
    expect(result.pulled).toBe(1);
    expect(result.errors).toHaveLength(0);

    const listed = await vault.list();
    expect(listed).toHaveLength(1);
    expect(listed[0].remotePath).toBe('remote.jpg');
    expect(listed[0].syncState).toBe('synced');

    const status = await engine.getStatus();
    expect(status.bindings['binding-1']?.cursor).toBe('cursor-2');
    expect(status.lastSyncAt).toBeTruthy();
  });

  it('run reports pull errors without silent failure', async () => {
    const { engine } = await createTestContext();
    const failing = createSyncEngine({
      vault: (await createTestContext()).vault,
      getBindings: () => [
        {
          bindingId: 'binding-1',
          provider: createMockSyncProvider({
            syncPull: async () => {
              throw new Error('network down');
            },
          }),
        },
      ],
    });

    const result = await failing.run({ direction: 'pull' });
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toContain('network down');
  });
});
