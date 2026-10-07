import { formatFileSize } from '@pixuli/core/utils';
import React from 'react';
import { getLibraryScaleTipKey } from '@/features/library/utils/libraryScale';

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

  // 以当前列表条数为准（虚拟窗口滚动的那批）
  const scaleTipKey = getLibraryScaleTipKey(filesCount);

  return (
    <div className="asset-library-status-bar" aria-live="polite">
      {loading ? (
        <span className="asset-library-status-bar-loading">
          <span className="asset-library-loading-spinner-inline" aria-hidden />
          {t('image.library.statusBar.loading')}
        </span>
      ) : (
        <>
          <div className="asset-library-status-bar-main">
            <span className="asset-library-status-bar-summary">{summary}</span>
            {scaleTipKey ? (
              <span
                className="asset-library-status-bar-scale-tip"
                role="status"
              >
                {t(scaleTipKey)}
              </span>
            ) : null}
          </div>
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
