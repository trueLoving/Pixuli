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

  it('caps root all-view without a path prefix', () => {
    expect(toLocalListOptions({ folderPath: '' })).toEqual({
      limit: LIBRARY_ROOT_LIST_CAP,
    });
    expect(toLocalListOptions({})).toEqual({
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
