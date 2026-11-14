import { describe, expect, it } from 'vitest';
import {
  isLibraryGoUpPath,
  libraryBreadcrumbSegments,
  libraryChildFolders,
  libraryFolderNavItems,
  LIBRARY_GO_UP_PATH,
  normalizeLibraryFolderPath,
  parentLibraryFolderPath,
  resolveLibraryFolderNavPath,
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
    expect(libraryBreadcrumbSegments('photos/covers', '/')).toEqual([
      { name: '/', path: '' },
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

  it('prepends go-up row when not at workspace root', () => {
    const children = [
      { name: 'covers', path: 'photos/covers' },
      { name: 'empty', path: 'photos/empty' },
    ];
    expect(libraryFolderNavItems(children, '')).toEqual(children);
    expect(libraryFolderNavItems(children, 'photos')).toEqual([
      { name: '..', path: LIBRARY_GO_UP_PATH },
      ...children,
    ]);
    expect(isLibraryGoUpPath(LIBRARY_GO_UP_PATH)).toBe(true);
    expect(
      resolveLibraryFolderNavPath(LIBRARY_GO_UP_PATH, 'photos/covers'),
    ).toBe('photos');
    expect(resolveLibraryFolderNavPath('photos/covers', 'photos')).toBe(
      'photos/covers',
    );
  });
});
