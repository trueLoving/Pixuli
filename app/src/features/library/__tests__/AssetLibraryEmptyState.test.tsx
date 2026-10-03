import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AssetLibraryEmptyState } from '../AssetLibraryEmptyState';

describe('AssetLibraryEmptyState search-in-all', () => {
  const t = (key: string) => key;

  it('offers search-in-all when folder filter is empty', () => {
    const onSearchInAll = vi.fn();
    render(
      <AssetLibraryEmptyState
        isFilteredEmpty
        isFolderEmpty={false}
        t={t}
        onSearchInAll={onSearchInAll}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'image.library.searchInAll' }),
    );
    expect(onSearchInAll).toHaveBeenCalled();
  });

  it('hides search-in-all when not a filtered empty state', () => {
    render(
      <AssetLibraryEmptyState
        isFilteredEmpty={false}
        isFolderEmpty
        t={t}
        onSearchInAll={vi.fn()}
        onAddFiles={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'image.library.searchInAll' }),
    ).toBeNull();
  });
});
