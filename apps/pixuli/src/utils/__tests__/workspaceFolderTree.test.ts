import { describe, expect, it } from 'vitest';
import {
  buildWorkspaceFolderTree,
  filterImagesByFolder,
} from '../workspaceFolderTree';

describe('workspaceFolderTree', () => {
  it('builds nested folders from relative paths', () => {
    const tree = buildWorkspaceFolderTree([
      'images/a.jpg',
      'images/b.jpg',
      'images/trip/c.jpg',
    ]);

    expect(tree.imageCount).toBe(3);
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0]?.path).toBe('images');
    expect(tree.children[0]?.imageCount).toBe(3);
    expect(tree.children[0]?.children[0]?.path).toBe('images/trip');
    expect(tree.children[0]?.children[0]?.imageCount).toBe(1);
  });

  it('filters images by selected folder', () => {
    const images = [
      { id: '1', localPath: 'images/a.jpg' },
      { id: '2', localPath: 'images/trip/b.jpg' },
      { id: '3', localPath: 'images/trip/c.jpg' },
    ];

    expect(filterImagesByFolder(images, '').map(i => i.id)).toEqual([
      '1',
      '2',
      '3',
    ]);
    expect(filterImagesByFolder(images, 'images/trip').map(i => i.id)).toEqual([
      '2',
      '3',
    ]);
  });
});
