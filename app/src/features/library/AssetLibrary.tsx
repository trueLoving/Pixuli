import {
  ContentFeedback,
  Search,
  UploadButton,
  keyboardManager,
  COMMON_SHORTCUTS,
  SHORTCUT_CATEGORIES,
} from '@/ui';
import type { LibrarySearchConfig } from '@/ui';
import type { NativeImagePickers } from '@/ui/image/image-upload/common/nativePickers';
import {
  filterAssetsByKind,
  getAssetKind,
  type AssetKindFilter,
} from '@/utils/assetKind';
import type {
  BatchUploadProgress,
  ImageItem,
  ImageUploadData,
  MultiImageUploadData,
  SortField,
  SortOrder,
} from '@pixuli/core/types';
import {
  filterImages,
  formatFileSize,
  getSortedImages,
} from '@pixuli/core/utils';
import {
  FileText,
  FileVideo,
  Folder,
  Image as ImageIcon,
  SearchX,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './AssetLibrary.css';

interface AssetLibraryProps {
  images: ImageItem[];
  hasConfig?: boolean;
  search?: LibrarySearchConfig;
  t: (key: string) => string;
  onUploadImage?: (data: ImageUploadData) => Promise<void>;
  onUploadMultipleImages?: (data: MultiImageUploadData) => Promise<void>;
  uploadLoading?: boolean;
  batchUploadProgress?: BatchUploadProgress | null;
  nativePickers?: NativeImagePickers;
  loading?: boolean;
  errorMessage?: string | null;
  onDismissError?: () => void;
  onRetry?: () => void;
  onOpenFolders?: () => void;
  selectedFileId?: string | null;
  onSelectedFileChange?: (file: ImageItem | null) => void;
}

const KIND_CHIPS: Array<[AssetKindFilter, string]> = [
  ['image', 'image.kind.image'],
  ['video', 'image.kind.video'],
  ['pdf', 'image.kind.pdf'],
  ['all', 'image.kind.all'],
];

function kindLabel(item: ImageItem, t: (key: string) => string): string {
  const kind = getAssetKind(item);
  if (kind === 'video') return t('image.kind.video');
  if (kind === 'pdf') return t('image.kind.pdf');
  return t('image.kind.image');
}

function FileGlyph({ item }: { item: ImageItem }) {
  const kind = getAssetKind(item);
  if (kind === 'image') {
    return <img className="asset-library-thumb" src={item.url} alt="" />;
  }
  const Icon = kind === 'video' ? FileVideo : FileText;
  return (
    <span className="asset-library-thumb-icon" aria-hidden>
      <Icon size={16} />
    </span>
  );
}

function sortIndicator(active: boolean, order: SortOrder): string {
  if (!active) return '';
  return order === 'asc' ? ' ↑' : ' ↓';
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({
  images,
  hasConfig = true,
  search,
  t,
  onUploadImage,
  onUploadMultipleImages,
  uploadLoading = false,
  batchUploadProgress,
  nativePickers,
  loading = false,
  errorMessage,
  onDismissError,
  onRetry,
  onOpenFolders,
  selectedFileId = null,
  onSelectedFileChange,
}) => {
  const [assetKind, setAssetKind] = useState<AssetKindFilter>('image');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    if (!search) return;
    search.onFiltersChange(prev => {
      if (prev.searchTerm === search.searchQuery) return prev;
      return { ...prev, searchTerm: search.searchQuery };
    });
  }, [search?.searchQuery, search?.onFiltersChange]);

  const filteredImages = useMemo(() => {
    if (!search?.filters) return images;
    return filterImages(images, search.filters);
  }, [images, search?.filters]);

  const files = useMemo(() => {
    const byKind = filterAssetsByKind(filteredImages, assetKind);
    const unique = new Map<string, ImageItem>();
    for (const item of byKind) {
      const existing = unique.get(item.id);
      if (
        !existing ||
        new Date(item.updatedAt).getTime() >
          new Date(existing.updatedAt).getTime()
      ) {
        unique.set(item.id, item);
      }
    }
    return getSortedImages([...unique.values()], sortField, sortOrder);
  }, [filteredImages, assetKind, sortField, sortOrder]);

  const selectedIndex = useMemo(
    () =>
      selectedFileId ? files.findIndex(item => item.id === selectedFileId) : -1,
    [files, selectedFileId],
  );

  useEffect(() => {
    if (selectedFileId && selectedIndex < 0) {
      onSelectedFileChange?.(null);
    }
  }, [onSelectedFileChange, selectedFileId, selectedIndex]);

  const selectAt = useCallback(
    (index: number) => {
      const next = files[index] ?? null;
      onSelectedFileChange?.(next);
      if (next) {
        requestAnimationFrame(() => {
          document
            .querySelector(`[data-file-id="${next.id}"]`)
            ?.scrollIntoView({ block: 'nearest' });
        });
      }
    },
    [files, onSelectedFileChange],
  );

  const navigate = useCallback(
    (delta: number) => {
      if (files.length === 0) return;
      if (selectedIndex < 0) {
        selectAt(delta > 0 ? 0 : files.length - 1);
        return;
      }
      const next = Math.min(
        files.length - 1,
        Math.max(0, selectedIndex + delta),
      );
      selectAt(next);
    },
    [files.length, selectAt, selectedIndex],
  );

  useEffect(() => {
    const shortcuts = [
      {
        key: COMMON_SHORTCUTS.ARROW_UP,
        description: t('keyboard.shortcuts.selectUp'),
        action: () => navigate(-1),
        category: SHORTCUT_CATEGORIES.IMAGE_BROWSER,
      },
      {
        key: COMMON_SHORTCUTS.ARROW_DOWN,
        description: t('keyboard.shortcuts.selectDown'),
        action: () => navigate(1),
        category: SHORTCUT_CATEGORIES.IMAGE_BROWSER,
      },
    ];
    keyboardManager.registerBatch(shortcuts);
    return () => {
      shortcuts.forEach(shortcut => keyboardManager.unregister(shortcut));
    };
  }, [navigate, t]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
        return;
      }
      setSortField(field);
      setSortOrder(field === 'name' ? 'asc' : 'desc');
    },
    [sortField],
  );

  const showEmpty = !loading && files.length === 0;
  const isFilteredEmpty = showEmpty && images.length > 0;

  return (
    <div className="asset-library">
      {errorMessage ? (
        <div className="asset-library-feedback">
          <ContentFeedback
            message={errorMessage}
            onDismiss={onDismissError}
            onRetry={onRetry}
            retryLabel={t('image.feedback.retry')}
            dismissLabel={t('image.feedback.dismiss')}
          />
        </div>
      ) : null}

      <div className="asset-library-toolbar">
        <div className="asset-library-header">
          <div className="asset-library-title-row">
            <h2 className="asset-library-title">{t('image.libraryTitle')}</h2>
            {loading ? (
              <span className="asset-library-loading-indicator">
                <span
                  className="asset-library-loading-spinner-inline"
                  aria-hidden
                />
                <span>{t('image.library.loading')}</span>
              </span>
            ) : null}
          </div>
          <span className="asset-library-count">
            {t('image.library.fileCount').replace(
              '{count}',
              String(files.length),
            )}
            {search && files.length !== images.length ? (
              <span className="asset-library-filter-count">
                {' '}
                / {images.length}
              </span>
            ) : null}
          </span>
        </div>

        <div
          className="asset-library-kind-chips"
          role="tablist"
          aria-label={t('image.kind.label')}
        >
          {KIND_CHIPS.map(([kind, labelKey]) => (
            <button
              key={kind}
              type="button"
              role="tab"
              aria-selected={assetKind === kind}
              className={`asset-library-kind-chip ${assetKind === kind ? 'asset-library-kind-chip--active' : ''}`}
              onClick={() => setAssetKind(kind)}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        {search ? (
          <Search
            variant="header"
            searchQuery={search.searchQuery}
            onSearchChange={search.onSearchChange}
            hasConfig={hasConfig}
            images={images}
            externalFilters={search.filters}
            onFiltersChange={search.onFiltersChange}
            showFilter={true}
            showHistory={true}
            history={search.history}
            onSelectHistory={search.onSelectHistory}
            onDeleteHistory={search.onDeleteHistory}
            onClearHistory={search.onClearHistory}
            onSaveHistory={search.onSaveHistory}
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
              onUploadImage={onUploadImage}
              onUploadMultipleImages={onUploadMultipleImages}
              loading={uploadLoading}
              batchUploadProgress={batchUploadProgress}
              t={t}
              className="asset-library-upload-btn"
              nativePickers={nativePickers}
            />
          ) : null}
        </div>
      </div>

      <div className="asset-library-content">
        {loading && files.length === 0 ? (
          <div className="asset-library-loading" aria-busy="true">
            <div className="asset-library-loading-spinner" />
            <p className="mt-3 text-sm text-gray-500">
              {t('image.library.loading')}
            </p>
          </div>
        ) : showEmpty ? (
          <div className="asset-library-empty">
            <div className="asset-library-empty-icon" aria-hidden>
              {isFilteredEmpty ? (
                <SearchX className="h-16 w-16 opacity-50" />
              ) : (
                <ImageIcon className="h-16 w-16 opacity-50" />
              )}
            </div>
            <h3 className="asset-library-empty-title">
              {t(
                isFilteredEmpty
                  ? 'image.library.filteredTitle'
                  : 'image.library.emptyTitle',
              )}
            </h3>
            <p className="asset-library-empty-description">
              {t(
                isFilteredEmpty
                  ? 'image.library.filteredDescription'
                  : 'image.library.emptyDescription',
              )}
            </p>
          </div>
        ) : (
          <div className="asset-library-table-wrap">
            <table className="asset-library-table">
              <thead>
                <tr>
                  <th>
                    <button type="button" onClick={() => handleSort('name')}>
                      {t('image.library.colName')}
                      {sortIndicator(sortField === 'name', sortOrder)}
                    </button>
                  </th>
                  <th className="asset-library-col-type">
                    {t('image.library.colType')}
                  </th>
                  <th className="asset-library-col-size">
                    <button type="button" onClick={() => handleSort('size')}>
                      {t('image.library.colSize')}
                      {sortIndicator(sortField === 'size', sortOrder)}
                    </button>
                  </th>
                  <th className="asset-library-col-date">
                    <button
                      type="button"
                      onClick={() => handleSort('createdAt')}
                    >
                      {t('image.library.colDate')}
                      {sortIndicator(sortField === 'createdAt', sortOrder)}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {files.map((file, index) => {
                  const selected = file.id === selectedFileId;
                  return (
                    <tr
                      key={file.id}
                      data-file-id={file.id}
                      className={`asset-library-row ${selected ? 'asset-library-row--selected' : ''}`}
                      aria-selected={selected}
                      onClick={() => selectAt(index)}
                    >
                      <td>
                        <div className="asset-library-name-cell">
                          <FileGlyph item={file} />
                          <span
                            className="asset-library-name-text"
                            title={file.name}
                          >
                            {file.name}
                          </span>
                        </div>
                      </td>
                      <td className="asset-library-col-type">
                        {kindLabel(file, t)}
                      </td>
                      <td className="asset-library-col-size">
                        {file.size > 0 ? formatFileSize(file.size) : '—'}
                      </td>
                      <td className="asset-library-col-date">
                        {file.createdAt
                          ? new Date(file.createdAt).toLocaleString()
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
