import { formatFileSize } from '@pixuli/core/utils';
import React from 'react';

export interface AssetLibraryStatusBarProps {
  filesCount: number;
  totalCount: number;
  totalSize: number;
  selectedCount: number;
  loading?: boolean;
  isFiltered?: boolean;
  t: (key: string) => string;
}

export const AssetLibraryStatusBar: React.FC<AssetLibraryStatusBarProps> = ({
  filesCount,
  totalCount,
  totalSize,
  selectedCount,
  loading = false,
  isFiltered = false,
  t,
}) => {
  const sizeLabel = formatFileSize(totalSize);
  const summaryKey = isFiltered
    ? 'image.library.statusBar.filtered'
    : 'image.library.statusBar.summary';

  const summary = t(summaryKey)
    .replace('{count}', String(filesCount))
    .replace('{visible}', String(filesCount))
    .replace('{total}', String(totalCount))
    .replace('{size}', sizeLabel);

  return (
    <div className="asset-library-status-bar" aria-live="polite">
      {loading ? (
        <span className="asset-library-status-bar-loading">
          <span className="asset-library-loading-spinner-inline" aria-hidden />
          {t('image.library.statusBar.loading')}
        </span>
      ) : (
        <>
          <span className="asset-library-status-bar-summary">{summary}</span>
          {selectedCount > 0 ? (
            <span className="asset-library-status-bar-selected">
              {t('image.library.statusBar.selected').replace(
                '{selected}',
                String(selectedCount),
              )}
            </span>
          ) : null}
        </>
      )}
    </div>
  );
};
