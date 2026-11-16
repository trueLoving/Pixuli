import { describe, expect, it } from 'vitest';
import { buildWorkspaceFolderTree, filterAssetsByFolder } from '../folderTree';

describe('workspaceFolderTree', () => {
  it('builds nested folders from relative paths', () => {
    const tree = buildWorkspaceFolderTree([
      'images/a.jpg',
      'images/b.jpg',
      'images/trip/c.jpg',
    ]);

    expect(tree.processableAssetCount).toBe(3);
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0]?.path).toBe('images');
    expect(tree.children[0]?.processableAssetCount).toBe(2);
    expect(tree.children[0]?.children[0]?.path).toBe('images/trip');
    expect(tree.children[0]?.children[0]?.processableAssetCount).toBe(1);
  });

  it('filters images by selected folder (shallow by default)', () => {
    const assets = [
      { id: '0', localPath: 'root.jpg' },
      { id: '1', localPath: 'images/a.jpg' },
      { id: '2', localPath: 'images/trip/b.jpg' },
      { id: '3', localPath: 'images/trip/c.jpg' },
    ];

    expect(filterAssetsByFolder(assets, '').map(i => i.id)).toEqual(['0']);
    expect(
      filterAssetsByFolder(assets, '', { shallow: false }).map(i => i.id),
    ).toEqual(['0', '1', '2', '3']);
    expect(filterAssetsByFolder(assets, 'images').map(i => i.id)).toEqual([
      '1',
    ]);
    expect(filterAssetsByFolder(assets, 'images/trip').map(i => i.id)).toEqual([
      '2',
      '3',
    ]);
    expect(
      filterAssetsByFolder(assets, 'images', { shallow: false }).map(i => i.id),
    ).toEqual(['1', '2', '3']);
  });

  it('includes empty folders in the tree', () => {
    const tree = buildWorkspaceFolderTree(['images/a.jpg'], ['images/empty']);
    expect(tree.children[0]?.children.map(c => c.path)).toContain(
      'images/empty',
    );
  });
});
