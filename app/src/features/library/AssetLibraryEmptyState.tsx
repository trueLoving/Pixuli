import { BrandPixelMark } from '@/ui/brand/BrandPixelMark';
import React from 'react';

export interface AssetLibraryEmptyStateProps {
  isFilteredEmpty: boolean;
  isFolderEmpty: boolean;
  t: (key: string) => string;
}

export const AssetLibraryEmptyState: React.FC<AssetLibraryEmptyStateProps> = ({
  isFilteredEmpty,
  isFolderEmpty,
  t,
}) => (
  <div className="asset-library-empty">
    <div className="asset-library-empty-icon" aria-hidden>
      <BrandPixelMark
        variant={isFilteredEmpty ? 'filter' : 'empty'}
        size={isFilteredEmpty ? 88 : 96}
      />
    </div>
    <h3 className="asset-library-empty-title">
      {t(
        isFilteredEmpty
          ? 'image.library.filteredTitle'
          : isFolderEmpty
            ? 'image.library.emptyFolderTitle'
            : 'image.library.emptyTitle',
      )}
    </h3>
    <p className="asset-library-empty-description">
      {t(
        isFilteredEmpty
          ? 'image.library.filteredDescription'
          : isFolderEmpty
            ? 'image.library.emptyFolderDescription'
            : 'image.library.emptyDescription',
      )}
    </p>
  </div>
);
