import { BrandPixelMark } from '@/ui/brand/BrandPixelMark';
import { FolderPlus, Upload } from 'lucide-react';
import React from 'react';

export interface AssetLibraryEmptyStateProps {
  isFilteredEmpty: boolean;
  isFolderEmpty: boolean;
  t: (key: string) => string;
  onAddFiles?: () => void;
  onNewSubfolder?: () => void;
}

export const AssetLibraryEmptyState: React.FC<AssetLibraryEmptyStateProps> = ({
  isFilteredEmpty,
  isFolderEmpty,
  t,
  onAddFiles,
  onNewSubfolder,
}) => {
  const showActions = !isFilteredEmpty && (onAddFiles || onNewSubfolder);

  return (
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
      {showActions ? (
        <div className="asset-library-empty-actions">
          {onAddFiles ? (
            <button
              type="button"
              className="asset-library-empty-btn asset-library-empty-btn--primary"
              onClick={onAddFiles}
            >
              <Upload size={16} aria-hidden />
              {t('image.library.addFiles')}
            </button>
          ) : null}
          {onNewSubfolder ? (
            <button
              type="button"
              className="asset-library-empty-btn"
              onClick={onNewSubfolder}
            >
              <FolderPlus size={16} aria-hidden />
              {t('image.library.newSubfolder')}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
