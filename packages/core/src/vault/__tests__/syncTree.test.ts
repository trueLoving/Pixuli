import { describe, expect, it } from 'vitest';
import {
  buildSyncTreeFromPaths,
  createEmptySyncTree,
  folderKeyFromFilePath,
  listDirtyFolderKeys,
  normalizeFolderKey,
  parseSyncTree,
  touchFolderInTree,
} from '../syncTree';

describe('syncTree', () => {
  it('normalizes folder keys and derives parent from file path', () => {
    expect(normalizeFolderKey('/images/trip/')).toBe('images/trip');
    expect(folderKeyFromFilePath('a.jpg')).toBe('');
    expect(folderKeyFromFilePath('images/a.jpg')).toBe('images');
    expect(folderKeyFromFilePath('images/trip/a.jpg')).toBe('images/trip');
  });

  it('parses sync-tree and rejects invalid version', () => {
    const tree = createEmptySyncTree('2026-01-01T00:00:00.000Z');
    expect(parseSyncTree(tree)?.revision).toBe(tree.revision);
    expect(
      parseSyncTree({ version: 2, revision: 'x', updatedAt: 'x', folders: {} }),
    ).toBeNull();
  });

  it('builds tree from paths and marks dirty folders by revision', () => {
    const remote = buildSyncTreeFromPaths(
      ['root.jpg', 'images/a.jpg', 'images/trip/b.jpg'],
      ['images', 'images/trip'],
      'rev-remote',
    );
    expect(Object.keys(remote.folders).sort()).toEqual([
      '',
      'images',
      'images/trip',
    ]);

    const dirty = listDirtyFolderKeys(remote, {}, null);
    expect(dirty).toEqual(['', 'images', 'images/trip']);

    const clean = listDirtyFolderKeys(
      remote,
      {
        '': { revision: 'rev-remote' },
        images: { revision: 'rev-remote' },
        'images/trip': { revision: 'rev-remote' },
      },
      'rev-remote',
    );
    expect(clean).toEqual([]);

    const forced = listDirtyFolderKeys(
      remote,
      {
        '': { revision: 'rev-remote' },
        images: { revision: 'rev-remote', dirty: true },
        'images/trip': { revision: 'rev-remote' },
      },
      'rev-remote',
    );
    expect(forced).toEqual(['images']);
  });

  it('touchFolderInTree bumps root and folder revision', () => {
    const base = createEmptySyncTree('t0');
    const next = touchFolderInTree(base, 'images', 't1');
    expect(next.revision).toBe('t1');
    expect(next.folders.images?.revision).toBe('t1');
    expect(next.folders['']?.revision).toBe('t0');
  });
});
