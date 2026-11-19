import { Archive, Folder, ListChecks, Search, X } from 'lucide-react';
import React, { RefObject } from 'react';
import UploadButton from './UploadButton';
import type { UploadButtonHandle } from './UploadButton';
import type { LibrarySearchConfig } from './librarySearchTypes';
import type { NativeImagePickers } from './asset-upload/nativePickers';
import type {
  BatchUploadProgress,
  AssetUploadData,
  MultiAssetUploadData,
} from '@pixuli/core/types';

export interface AssetLibraryToolbarProps {
  hasConfig: boolean;
  search?: LibrarySearchConfig;
  t: (key: string) => string;
  onOpenFolders?: () => void;
  onOpenSearch?: () => void;
  onClearSearch?: () => void;
  onUploadAsset?: (data: AssetUploadData) => Promise<unknown>;
  onUploadMultipleAssets?: (data: MultiAssetUploadData) => Promise<unknown>;
  uploadLoading?: boolean;
  batchUploadProgress?: BatchUploadProgress | null;
  nativePickers?: NativeImagePickers;
  selectedFolderPath?: string;
  uploadButtonRef: RefObject<UploadButtonHandle | null>;
  multiSelectMode?: boolean;
  onToggleSelectMode?: () => void;
  /** 导入局域网转移包 */
  onImportTransfer?: () => void;
}

export const AssetLibraryToolbar: React.FC<AssetLibraryToolbarProps> = ({
  hasConfig,
  search,
  t,
  onOpenFolders,
  onOpenSearch,
  onClearSearch,
  onUploadAsset,
  onUploadMultipleAssets,
  uploadLoading = false,
  batchUploadProgress,
  nativePickers,
  selectedFolderPath,
  uploadButtonRef,
  multiSelectMode = false,
  onToggleSelectMode,
  onImportTransfer,
}) => {
  const activeQuery = search?.searchQuery?.trim() ?? '';
  const searchActive = activeQuery.length > 0;

  return (
    <div className="asset-library-toolbar">
      {onOpenFolders ? (
        <button
          type="button"
          className="asset-library-icon-btn asset-library-folders-btn"
          onClick={onOpenFolders}
          aria-label={t('workspace.explorer')}
          title={t('workspace.explorer')}
        >
          <Folder size={18} aria-hidden />
        </button>
      ) : null}

      {search && onOpenSearch ? (
        <button
          type="button"
          className={`asset-library-icon-btn asset-library-search-btn${searchActive ? ' is-active' : ''}`}
          onClick={onOpenSearch}
          disabled={!hasConfig}
          aria-label={t('image.grid.searchImages')}
          title={`${t('image.grid.searchImages')} (⌘K / Ctrl+K · ⌘⇧K 清除)`}
        >
          <Search size={18} aria-hidden />
        </button>
      ) : null}

      {searchActive && onOpenSearch ? (
        <div className="asset-library-search-chip">
          <button
            type="button"
            className="asset-library-search-chip-query"
            onClick={onOpenSearch}
            title={t('image.library.editSearchHint')}
          >
            <span className="asset-library-search-chip-text">
              {activeQuery}
            </span>
          </button>
          {onClearSearch ? (
            <button
              type="button"
              className="asset-library-search-chip-clear"
              onClick={onClearSearch}
              aria-label={t('image.library.clearSearch')}
              title={t('image.library.clearSearch')}
            >
              <X size={14} aria-hidden />
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="asset-library-toolbar-spacer" aria-hidden />

      <div className="asset-library-controls">
        {onToggleSelectMode ? (
          <button
            type="button"
            className={`asset-library-icon-btn asset-library-select-btn${multiSelectMode ? ' is-active' : ''}`}
            onClick={onToggleSelectMode}
            aria-pressed={multiSelectMode}
            aria-label={t('image.library.selectMode')}
            title={`${t('image.library.selectMode')} (M · Esc)`}
          >
            <ListChecks size={18} aria-hidden />
          </button>
        ) : null}

        {onImportTransfer ? (
          <button
            type="button"
            className="asset-library-icon-btn"
            onClick={onImportTransfer}
            aria-label={t('settings.lanShare.importTitle')}
            title={t('settings.lanShare.importTitle')}
          >
            <Archive size={18} aria-hidden />
          </button>
        ) : null}

        {onUploadAsset && onUploadMultipleAssets ? (
          <UploadButton
            ref={uploadButtonRef}
            onUploadAsset={onUploadAsset}
            onUploadMultipleAssets={onUploadMultipleAssets}
            loading={uploadLoading}
            batchUploadProgress={batchUploadProgress}
            t={t}
            className="asset-library-upload-btn asset-library-icon-btn asset-library-icon-btn--accent"
            nativePickers={nativePickers}
            defaultFolder={selectedFolderPath}
            iconOnly
          />
        ) : null}
      </div>
    </div>
  );
};
