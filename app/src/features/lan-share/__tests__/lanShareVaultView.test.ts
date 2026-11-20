import { describe, expect, it } from 'vitest';
import {
  collectVaultShareFilePaths,
  listVaultShareDirectory,
  vaultDisplayNameForPath,
} from '../lanShareVaultView';

const entries = [
  {
    relativePath: 'photos/1794-a.jpg',
    name: 'Holiday',
    size: 10,
    mimeType: 'image/jpeg',
  },
  {
    relativePath: 'photos/trip/b.png',
    name: 'Trip shot',
    size: 20,
    mimeType: 'image/png',
  },
  {
    relativePath: 'root.txt',
    name: 'Notes',
    size: 3,
    mimeType: 'text/plain',
  },
  {
    relativePath: 'gone/old.jpg',
    name: 'Gone',
    deletedAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('lanShareVaultView', () => {
  it('lists vault shallow dirs/files with display names', () => {
    const root = listVaultShareDirectory(entries, ['empty/box'], '');
    expect(root.map(item => `${item.kind}:${item.name}`)).toEqual([
      'dir:empty',
      'dir:photos',
      'file:Notes',
    ]);

    const photos = listVaultShareDirectory(entries, ['empty/box'], 'photos');
    expect(
      photos.map(item => `${item.kind}:${item.name}:${item.relativePath}`),
    ).toEqual(['dir:trip:photos/trip', 'file:Holiday:photos/1794-a.jpg']);
  });

  it('expands selected folders via vault index paths', () => {
    expect(
      collectVaultShareFilePaths(entries, ['empty/box'], ['photos']),
    ).toEqual(['photos/1794-a.jpg', 'photos/trip/b.png']);
    expect(
      collectVaultShareFilePaths(
        entries,
        [],
        ['photos/1794-a.jpg', 'root.txt'],
      ),
    ).toEqual(['photos/1794-a.jpg', 'root.txt']);
    expect(collectVaultShareFilePaths(entries, [], ['gone'])).toEqual([]);
  });

  it('resolves vault display names', () => {
    expect(vaultDisplayNameForPath(entries, 'photos/1794-a.jpg')).toBe(
      'Holiday',
    );
    expect(vaultDisplayNameForPath(entries, 'missing')).toBeNull();
  });
});
