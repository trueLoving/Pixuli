import { describe, expect, it } from 'vitest';
import { toLocalListOptions } from '@/features/library/libraryListScope';
import { LIBRARY_ROOT_LIST_CAP } from '@/features/library/utils/libraryScale';

/**
 * 与 useLibraryRoute 一致：仅在「有查询 + 工作区范围 + 当前在文件夹内」时扩大为全库搜索。
 */
function resolveListScope(
  selectedFolderPath: string | null | undefined,
  searchScope: 'folder' | 'workspace',
  searchQuery: string,
) {
  const searchAllWorkspace =
    searchScope === 'workspace' &&
    Boolean(searchQuery.trim()) &&
    Boolean(selectedFolderPath);
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

  it('caps root list when already at workspace root', () => {
    expect(resolveListScope('', 'workspace', 'jpg')).toEqual({
      limit: LIBRARY_ROOT_LIST_CAP,
    });
  });
});
