import { describe, expect, it } from 'vitest';
import { createLocalVault } from '../localVault';
import { MemoryWorkspaceAdapter } from '../memoryAdapter';
import {
  readLatestCheckpointMeta,
  restoreLatestSyncCheckpoint,
  writeLatestSyncCheckpoint,
} from '../syncCheckpoint';

describe('syncCheckpoint', () => {
  it('writes latest checkpoint and restores modified / local-only drift', async () => {
    const adapter = new MemoryWorkspaceAdapter('desktop');
    await adapter.pickRoot();
    const vault = createLocalVault(adapter);
    await vault.open();

    await vault.importFile(new Uint8Array([1, 2, 3]), 'images/a.jpg', {
      name: 'a.jpg',
      syncState: 'synced',
      remotePath: 'images/a.jpg',
      bindingId: 'b1',
    });
    await vault.importFile(new Uint8Array([4, 5]), 'root.txt', {
      name: 'root.txt',
      syncState: 'synced',
      remotePath: 'root.txt',
      bindingId: 'b1',
    });

    const meta = await writeLatestSyncCheckpoint(vault, {
      bindingId: 'b1',
      treeRevision: 'tree-1',
    });
    expect(meta.fileCount).toBe(2);
    expect(await readLatestCheckpointMeta(adapter)).toMatchObject({
      treeRevision: 'tree-1',
      fileCount: 2,
    });

    await adapter.writeFile('images/a.jpg', new Uint8Array([9, 9, 9]));
    await vault.updateMetadata('images/a.jpg', { name: 'changed' });
    await vault.importFile(new Uint8Array([7]), 'only-local.jpg', {
      syncState: 'local-only',
    });

    const result = await restoreLatestSyncCheckpoint(vault);
    expect(result.removed).toBe(1);
    expect(result.restored).toBe(2);
    expect(await vault.getByPath('only-local.jpg')).toBeNull();
    expect((await vault.getByPath('images/a.jpg'))?.name).toBe('a.jpg');
    expect(await adapter.readFile('images/a.jpg')).toEqual(
      new Uint8Array([1, 2, 3]),
    );
  });
});
