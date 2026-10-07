import { describe, expect, it } from 'vitest';
import { toLocalListOptions } from '@/features/library/libraryListScope';

describe('toLocalListOptions (store lazy scope)', () => {
  it('uses shallow pathPrefix for a selected folder', () => {
    expect(toLocalListOptions({ folderPath: 'photos/2024' })).toEqual({
      pathPrefix: 'photos/2024',
      shallow: true,
    });
  });

  it('lists whole vault at root (no prefix)', () => {
    expect(toLocalListOptions({ folderPath: '' })).toEqual({});
    expect(toLocalListOptions({})).toEqual({});
  });

  it('uses vault search when searchAll has a query', () => {
    expect(
      toLocalListOptions({
        folderPath: 'photos',
        searchAll: true,
        searchQuery: 'cat',
      }),
    ).toEqual({ search: 'cat' });
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
