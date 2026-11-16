import { describe, expect, it } from 'vitest';
import { toLocalListOptions } from '@/features/library/libraryListScope';
import { LIBRARY_ROOT_LIST_CAP } from '@/features/library/utils/libraryScale';

describe('toLocalListOptions (store lazy scope)', () => {
  it('uses shallow pathPrefix for a selected folder', () => {
    expect(toLocalListOptions({ folderPath: 'photos/2024' })).toEqual({
      pathPrefix: 'photos/2024',
      shallow: true,
    });
  });

  it('uses shallow root list with a cap when no path prefix', () => {
    expect(toLocalListOptions({ folderPath: '' })).toEqual({
      shallow: true,
      limit: LIBRARY_ROOT_LIST_CAP,
    });
    expect(toLocalListOptions({})).toEqual({
      shallow: true,
      limit: LIBRARY_ROOT_LIST_CAP,
    });
  });

  it('uses vault search at root when a query is committed', () => {
    expect(toLocalListOptions({ folderPath: '', searchQuery: 'cat' })).toEqual({
      search: 'cat',
      limit: LIBRARY_ROOT_LIST_CAP,
    });
  });

  it('uses vault search when searchAll has a query', () => {
    expect(
      toLocalListOptions({
        folderPath: 'photos',
        searchAll: true,
        searchQuery: 'cat',
      }),
    ).toEqual({ search: 'cat', limit: LIBRARY_ROOT_LIST_CAP });
  });

  it('ignores searchAll without a committed query', () => {
    expect(
      toLocalListOptions({
        folderPath: 'photos',
        searchAll: true,
        searchQuery: '  ',
      }),
    ).toEqual({ pathPrefix: 'photos', shallow: true });
  });
});
