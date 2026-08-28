import { Search } from '@/ui';
import { Folder } from 'lucide-react';
import React, { RefObject } from 'react';
import UploadButton from './UploadButton';
import type { UploadButtonHandle } from './UploadButton';
import type { LibrarySearchConfig } from './librarySearchTypes';
import type { NativeImagePickers } from './image-upload/nativePickers';
import type {
  BatchUploadProgress,
  ImageUploadData,
  MultiImageUploadData,
} from '@pixuli/core/types';

export interface AssetLibraryToolbarProps {
  filesCount: number;
  totalCount: number;
  loading: boolean;
  hasConfig: boolean;
  search?: LibrarySearchConfig;
  t: (key: string) => string;
  onOpenFolders?: () => void;
  onUploadImage?: (data: ImageUploadData) => Promise<unknown>;
  onUploadMultipleImages?: (data: MultiImageUploadData) => Promise<unknown>;
  uploadLoading?: boolean;
  batchUploadProgress?: BatchUploadProgress | null;
  nativePickers?: NativeImagePickers;
  selectedFolderPath?: string;
  uploadButtonRef: RefObject<UploadButtonHandle | null>;
}

export const AssetLibraryToolbar: React.FC<AssetLibraryToolbarProps> = ({
  filesCount,
  totalCount,
  loading,
  hasConfig,
  search,
  t,
  onOpenFolders,
  onUploadImage,
  onUploadMultipleImages,
  uploadLoading = false,
  batchUploadProgress,
  nativePickers,
  selectedFolderPath,
  uploadButtonRef,
}) => (
  <div className="asset-library-toolbar">
    <div className="asset-library-header">
      {loading ? (
        <span className="asset-library-loading-indicator">
          <span className="asset-library-loading-spinner-inline" aria-hidden />
          <span>{t('image.library.loading')}</span>
        </span>
      ) : (
        <span className="asset-library-count">
          {t('image.library.fileCount').replace('{count}', String(filesCount))}
          {search && filesCount !== totalCount ? (
            <span className="asset-library-filter-count"> / {totalCount}</span>
          ) : null}
        </span>
      )}
    </div>

    {search ? (
      <Search
        variant="header"
        searchQuery={search.searchQuery}
        draftQuery={search.draftQuery}
        onDraftChange={search.onDraftChange}
        onCommitSearch={search.onCommitSearch}
        onSearchChange={search.onSearchChange}
        hasConfig={hasConfig}
        showHistory={true}
        history={search.history}
        onSelectHistory={search.onSelectHistory}
        onDeleteHistory={search.onDeleteHistory}
        onClearHistory={search.onClearHistory}
        t={t}
        className="asset-library-search"
      />
    ) : null}

    <div className="asset-library-controls">
      {onOpenFolders ? (
        <button
          type="button"
          className="asset-library-chrome-btn asset-library-folders-btn"
          onClick={onOpenFolders}
          aria-label={t('workspace.explorer')}
          title={t('workspace.explorer')}
        >
          <Folder size={16} aria-hidden />
          <span>{t('workspace.explorer')}</span>
        </button>
      ) : null}

      {onUploadImage && onUploadMultipleImages ? (
        <UploadButton
          ref={uploadButtonRef}
          onUploadImage={onUploadImage}
          onUploadMultipleImages={onUploadMultipleImages}
          loading={uploadLoading}
          batchUploadProgress={batchUploadProgress}
          t={t}
          className="asset-library-upload-btn"
          nativePickers={nativePickers}
          defaultFolder={selectedFolderPath || 'images'}
        />
      ) : null}
    </div>
  </div>
);
