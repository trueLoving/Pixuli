import { describe, expect, it } from 'vitest';
import { toLocalListOptions } from '@/features/library/libraryListScope';
import { LIBRARY_ROOT_LIST_CAP } from '@/features/library/utils/libraryScale';

/**
 * 与 useLibraryRoute 一致：有查询且范围为 workspace 时全库搜索（默认）。
 */
function resolveListScope(
  selectedFolderPath: string | null | undefined,
  searchScope: 'folder' | 'workspace',
  searchQuery: string,
) {
  const searchAllWorkspace =
    searchScope === 'workspace' && Boolean(searchQuery.trim());
  return toLocalListOptions({
    folderPath: selectedFolderPath ?? '',
    searchAll: searchAllWorkspace,
    searchQuery: searchQuery.trim() || undefined,
  });
}

describe('library search scope → vault list (REF-603 lazy store)', () => {
  it('keeps folder shallow list when scope is folder', () => {
    expect(resolveListScope('photos', 'folder', 'jpg')).toEqual({
      pathPrefix: 'photos',
      shallow: true,
    });
  });

  it('expands to vault search when scope is workspace', () => {
    expect(resolveListScope('photos', 'workspace', 'jpg')).toEqual({
      search: 'jpg',
      limit: LIBRARY_ROOT_LIST_CAP,
    });
  });

  it('does not expand without a committed query', () => {
    expect(resolveListScope('photos', 'workspace', '')).toEqual({
      pathPrefix: 'photos',
      shallow: true,
    });
  });

  it('searches the whole library from root when a query is set', () => {
    expect(resolveListScope('', 'workspace', 'jpg')).toEqual({
      search: 'jpg',
      limit: LIBRARY_ROOT_LIST_CAP,
    });
    expect(resolveListScope('', 'folder', '')).toEqual({
      shallow: true,
      limit: LIBRARY_ROOT_LIST_CAP,
    });
  });
});
