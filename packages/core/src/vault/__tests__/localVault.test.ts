import { describe, expect, it } from 'vitest';
import { WORKSPACE_PATHS } from '../paths';
import { createLocalVault } from '../localVault';
import { MemoryWorkspaceAdapter } from '../memoryAdapter';
import { decodeJson } from '../utils';

describe('MemoryWorkspaceAdapter', () => {
  it('reads and writes files after pickRoot', async () => {
    const adapter = new MemoryWorkspaceAdapter('desktop');
    expect(adapter.isReady()).toBe(false);
    await adapter.pickRoot();
    await adapter.writeFile('images/a.jpg', new Uint8Array([1, 2, 3]));
    const data = await adapter.readFile('images/a.jpg');
    expect(data).toEqual(new Uint8Array([1, 2, 3]));
    expect(await adapter.listFiles('images')).toEqual(['images/a.jpg']);
  });
});

describe('createLocalVault', () => {
  it('open initializes config and index', async () => {
    const adapter = new MemoryWorkspaceAdapter();
    const vault = createLocalVault(adapter);
    await vault.open();

    const config = vault.getConfig();
    expect(config.schemaVersion).toBe(1);
    expect(config.workspaceId).toBeTruthy();
    expect(await adapter.exists(WORKSPACE_PATHS.config)).toBe(true);
    expect(await adapter.exists(WORKSPACE_PATHS.index)).toBe(true);
  });

  it('importFile adds entry and persists index', async () => {
    const adapter = new MemoryWorkspaceAdapter();
    const vault = createLocalVault(adapter);
    await vault.open();

    const file = new File([new Uint8Array([9, 9, 9])], 'photo.jpg', {
      type: 'image/jpeg',
    });
    const entry = await vault.importFile(file, 'images/photo.jpg', {
      tags: ['test'],
      width: 100,
      height: 80,
    });

    expect(entry.relativePath).toBe('images/photo.jpg');
    expect(entry.tags).toEqual(['test']);
    expect(entry.syncState).toBe('local-only');

    const listed = await vault.list();
    expect(listed).toHaveLength(1);
    expect(listed[0].name).toBe('photo.jpg');

    const raw = await adapter.readFile(WORKSPACE_PATHS.index);
    const persisted = decodeJson<{ entries: unknown[] }>(raw);
    expect(persisted.entries).toHaveLength(1);
  });

  it('updateMetadata and softDelete update index', async () => {
    const adapter = new MemoryWorkspaceAdapter();
    const vault = createLocalVault(adapter);
    await vault.open();

    adapter.seedFile('images/x.png', new Uint8Array(10));
    await vault.importFile('images/x.png', 'images/x.png');

    const updated = await vault.updateMetadata('images/x.png', {
      description: 'hello',
      tags: ['a'],
    });
    expect(updated.description).toBe('hello');

    await vault.softDelete('images/x.png');
    expect(await vault.list()).toHaveLength(0);
    const deleted = await vault.getByPath('images/x.png');
    expect(deleted?.deletedAt).toBeTruthy();
    expect((await vault.list({ includeDeleted: true })).length).toBe(1);
  });

  it('updateSyncMeta updates sync fields', async () => {
    const adapter = new MemoryWorkspaceAdapter();
    const vault = createLocalVault(adapter);
    await vault.open();

    const file = new File([new Uint8Array([1])], 'a.jpg', {
      type: 'image/jpeg',
    });
    await vault.importFile(file, 'images/a.jpg');

    const updated = await vault.updateSyncMeta('images/a.jpg', {
      syncState: 'synced',
      remotePath: 'a.jpg',
      bindingId: 'source-1',
    });

    expect(updated.syncState).toBe('synced');
    expect(updated.remotePath).toBe('a.jpg');
    expect(updated.bindingId).toBe('source-1');

    const listed = await vault.list();
    expect(listed[0].syncState).toBe('synced');
    expect(listed[0].remotePath).toBe('a.jpg');
  });

  it('upsertBindings merges bindings by id', async () => {
    const adapter = new MemoryWorkspaceAdapter();
    const vault = createLocalVault(adapter);
    await vault.open();

    const first = await vault.upsertBindings([
      {
        id: 'source-1',
        label: 'GitHub',
        pluginId: 'github',
        remotePathPrefix: 'images',
        localPathPrefix: 'images',
        config: { owner: 'a', repo: 'b', token: 't', path: 'images' },
      },
    ]);
    expect(first.bindings).toHaveLength(1);
    expect(first.bindings[0].label).toBe('GitHub');

    const second = await vault.upsertBindings([
      {
        id: 'source-1',
        label: 'GitHub updated',
        pluginId: 'github',
        remotePathPrefix: 'photos',
        localPathPrefix: 'photos',
        config: { owner: 'a', repo: 'b', token: 't', path: 'photos' },
      },
      {
        id: 'source-2',
        label: 'Gitee',
        pluginId: 'gitee',
        remotePathPrefix: 'img',
        localPathPrefix: 'img',
        config: { owner: 'x', repo: 'y', token: 't', path: 'img' },
      },
    ]);
    expect(second.bindings).toHaveLength(2);
    expect(second.bindings.find(item => item.id === 'source-1')?.label).toBe(
      'GitHub updated',
    );

    const reopened = createLocalVault(adapter);
    await reopened.open();
    expect(reopened.getConfig().bindings).toHaveLength(2);
  });

  it('scan discovers files under images/', async () => {
    const adapter = new MemoryWorkspaceAdapter();
    const vault = createLocalVault(adapter);
    await vault.open();

    adapter.seedFile('images/new/shot.webp', new Uint8Array(4));
    const added = await vault.scan();
    expect(added).toBe(1);
    expect(await vault.list()).toHaveLength(1);
    expect((await vault.list())[0].mimeType).toBe('image/webp');
  });
});
