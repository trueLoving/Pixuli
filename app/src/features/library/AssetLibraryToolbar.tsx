import { Search } from '@/ui';
import { Folder, ListChecks } from 'lucide-react';
import React, { RefObject } from 'react';
import UploadButton from './UploadButton';
import type { UploadButtonHandle } from './UploadButton';
import type { LibrarySearchConfig } from './librarySearchTypes';
import type { NativeImagePickers } from './image-upload/nativePickers';
import type {
  BatchUploadProgress,
  ImageItem,
  ImageUploadData,
  MultiImageUploadData,
} from '@pixuli/core/types';

export interface AssetLibraryToolbarProps {
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
  multiSelectMode?: boolean;
  onToggleSelectMode?: () => void;
  onUploadComplete?: (items: ImageItem[]) => void;
}

export const AssetLibraryToolbar: React.FC<AssetLibraryToolbarProps> = ({
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
  multiSelectMode = false,
  onToggleSelectMode,
  onUploadComplete,
}) => (
  <div className="asset-library-toolbar">
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
      {onToggleSelectMode ? (
        <button
          type="button"
          className={`asset-library-icon-btn asset-library-select-btn${multiSelectMode ? ' is-active' : ''}`}
          onClick={onToggleSelectMode}
          aria-pressed={multiSelectMode}
          aria-label={t('image.library.selectMode')}
          title={t('image.library.selectMode')}
        >
          <ListChecks size={18} aria-hidden />
        </button>
      ) : null}

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

      {onUploadImage && onUploadMultipleImages ? (
        <UploadButton
          ref={uploadButtonRef}
          onUploadImage={onUploadImage}
          onUploadMultipleImages={onUploadMultipleImages}
          loading={uploadLoading}
          batchUploadProgress={batchUploadProgress}
          t={t}
          className="asset-library-upload-btn asset-library-icon-btn asset-library-icon-btn--accent"
          nativePickers={nativePickers}
          defaultFolder={selectedFolderPath || 'images'}
          iconOnly
          onUploadComplete={onUploadComplete}
        />
      ) : null}
    </div>
  </div>
);
