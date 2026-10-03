import { BrandPixelMark } from '@/ui/brand/BrandPixelMark';
import { FolderPlus, Search, Upload } from 'lucide-react';
import React from 'react';

export interface AssetLibraryEmptyStateProps {
  isFilteredEmpty: boolean;
  isFolderEmpty: boolean;
  t: (key: string) => string;
  onAddFiles?: () => void;
  onNewSubfolder?: () => void;
  /** 文件夹范围内无匹配时，扩到整个工作区 */
  onSearchInAll?: () => void;
}

export const AssetLibraryEmptyState: React.FC<AssetLibraryEmptyStateProps> = ({
  isFilteredEmpty,
  isFolderEmpty,
  t,
  onAddFiles,
  onNewSubfolder,
  onSearchInAll,
}) => {
  const showActions =
    (!isFilteredEmpty && (onAddFiles || onNewSubfolder)) ||
    (isFilteredEmpty && onSearchInAll);

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
          {isFilteredEmpty && onSearchInAll ? (
            <button
              type="button"
              className="asset-library-empty-btn asset-library-empty-btn--primary"
              onClick={onSearchInAll}
            >
              <Search size={16} aria-hidden />
              {t('image.library.searchInAll')}
            </button>
          ) : null}
          {!isFilteredEmpty && onAddFiles ? (
            <button
              type="button"
              className="asset-library-empty-btn asset-library-empty-btn--primary"
              onClick={onAddFiles}
            >
              <Upload size={16} aria-hidden />
              {t('image.library.addFiles')}
            </button>
          ) : null}
          {!isFilteredEmpty && onNewSubfolder ? (
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
