import { describe, expect, it } from 'vitest';
import {
  libraryBreadcrumbSegments,
  libraryChildFolders,
  normalizeLibraryFolderPath,
  parentLibraryFolderPath,
} from '../libraryNavigation';

describe('libraryNavigation', () => {
  it('treats blank and __root__ as the workspace root', () => {
    expect(normalizeLibraryFolderPath('')).toBe('');
    expect(normalizeLibraryFolderPath('__root__')).toBe('');
    expect(normalizeLibraryFolderPath('/photos/')).toBe('photos');
  });

  it('builds parent and breadcrumb segments', () => {
    expect(parentLibraryFolderPath('')).toBe('');
    expect(parentLibraryFolderPath('photos')).toBe('');
    expect(parentLibraryFolderPath('photos/covers')).toBe('photos');
    expect(libraryBreadcrumbSegments('photos/covers', '全部')).toEqual([
      { name: '全部', path: '' },
      { name: 'photos', path: 'photos' },
      { name: 'covers', path: 'photos/covers' },
    ]);
  });

  it('lists only the current level, including empty folders', () => {
    const children = libraryChildFolders(
      ['photos/a.png', 'photos/covers/b.png', 'notes/c.pdf'],
      ['photos/empty'],
      'photos',
    );
    expect(children).toEqual([
      { name: 'covers', path: 'photos/covers' },
      { name: 'empty', path: 'photos/empty' },
    ]);
    expect(
      libraryChildFolders(['photos/a.png', 'notes/c.pdf'], [], '').map(
        folder => folder.name,
      ),
    ).toEqual(['notes', 'photos']);
  });
});
