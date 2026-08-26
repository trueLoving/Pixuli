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
import { isAssetPublished } from '@/features/access/accessPolicyStore';
import { hasPublishableRemoteUrl } from '@/features/access/accessCapabilities';
import { useSourceStore } from '@/stores/sourceStore';
import { useUIStore } from '@/stores/uiStore';
import { getAssetKind } from '@/utils/assetKind';
import { filterByLibraryQuery } from '@/utils/libraryQuery';
import { nextSelectedIds, pruneSelectedIds } from '@/utils/librarySelection';
import { BrandPixelMark } from '@/ui/brand/BrandPixelMark';
import { getVirtualWindow, LIBRARY_ROW_HEIGHT } from '@/utils/virtualWindow';
import type {
  BatchUploadProgress,
  ImageItem,
  ImageUploadData,
  MultiImageUploadData,
  SortField,
  SortOrder,
} from '@pixuli/core/types';
import { formatFileSize, getSortedImages } from '@pixuli/core/utils';
import {
  Folder,
  Cloud,
  Globe,
  HardDrive,
  RefreshCw,
  Trash2,
  Wand2,
} from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import './AssetLibrary.css';
import { AssetThumb } from './AssetThumb';

const LONG_PRESS_MS = 480;

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
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[], items?: ImageItem[]) => void;
  onDeleteImage?: (id: string, name: string) => Promise<void>;
  onDeleteMultipleImages?: (ids: string[], names: string[]) => Promise<void>;
  onSync?: () => void;
  onOpenAccess?: (imageId: string, imageIds?: string[]) => void;
  onSendCompress?: () => void;
  onSendConvert?: () => void;
}

function kindLabel(item: ImageItem, t: (key: string) => string): string {
  const kind = getAssetKind(item);
  if (kind === 'video') return t('image.kind.video');
  if (kind === 'pdf') return t('image.kind.pdf');
  if (kind === 'other') return t('image.kind.other');
  return t('image.kind.image');
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
  selectedIds,
  onSelectedIdsChange,
  onDeleteImage,
  onDeleteMultipleImages,
  onSync,
  onOpenAccess,
  onSendCompress,
  onSendConvert,
}) => {
  const sources = useSourceStore(state => state.sources);
  const selectedSourceId = useSourceStore(state => state.selectedSourceId);
  const sourceId = selectedSourceId ?? sources[0]?.id;
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [multiMode, setMultiMode] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    file: ImageItem;
  } | null>(null);
  const anchorIdRef = useRef<string | null>(null);
  const longPressRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);
  const tableWrapRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(480);

  useEffect(() => {
    if (!search) return;
    // 保持 filters.searchTerm 与查询框同步（历史兼容）；实际过滤走 libraryQuery
    search.onFiltersChange(prev => {
      if (prev.searchTerm === search.searchQuery) return prev;
      return {
        ...prev,
        searchTerm: search.searchQuery,
        selectedTypes: [],
        selectedTags: [],
        selectedKinds: [],
      };
    });
  }, [search?.searchQuery, search?.onFiltersChange]);

  const files = useMemo(() => {
    const filtered = filterByLibraryQuery(images, search?.searchQuery ?? '');
    const unique = new Map<string, ImageItem>();
    for (const item of filtered) {
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
  }, [images, search?.searchQuery, sortField, sortOrder]);

  const visibleIds = useMemo(() => files.map(file => file.id), [files]);

  useEffect(() => {
    const next = pruneSelectedIds(selectedIds, visibleIds);
    if (next !== selectedIds) {
      const selectedItems = next
        .map(id => files.find(file => file.id === id))
        .filter((item): item is ImageItem => Boolean(item));
      onSelectedIdsChange(next, selectedItems);
      if (next.length <= 1) setMultiMode(false);
    }
  }, [files, onSelectedIdsChange, selectedIds, visibleIds]);

  const applySelection = useCallback(
    (
      clickedId: string,
      additive: boolean,
      range: boolean,
      enterMulti = false,
    ) => {
      if (enterMulti) setMultiMode(true);
      const next = nextSelectedIds({
        visibleIds,
        selectedIds,
        clickedId,
        additive,
        range,
        anchorId: anchorIdRef.current,
        multiMode: enterMulti || multiMode,
      });
      anchorIdRef.current = next.anchorId;
      const selectedItems = next.selectedIds
        .map(id => files.find(file => file.id === id))
        .filter((item): item is ImageItem => Boolean(item));
      onSelectedIdsChange(next.selectedIds, selectedItems);
      if (next.selectedIds.length <= 1 && !enterMulti && !additive && !range) {
        setMultiMode(false);
      }
      requestAnimationFrame(() => {
        document
          .querySelector(`[data-file-id="${clickedId}"]`)
          ?.scrollIntoView({ block: 'nearest' });
      });
    },
    [files, multiMode, onSelectedIdsChange, selectedIds, visibleIds],
  );

  const selectedIndex = useMemo(() => {
    const last = selectedIds[selectedIds.length - 1];
    return last ? files.findIndex(item => item.id === last) : -1;
  }, [files, selectedIds]);

  const navigate = useCallback(
    (delta: number) => {
      if (files.length === 0) return;
      if (selectedIndex < 0) {
        applySelection(
          files[delta > 0 ? 0 : files.length - 1].id,
          false,
          false,
        );
        return;
      }
      const next = Math.min(
        files.length - 1,
        Math.max(0, selectedIndex + delta),
      );
      applySelection(files[next].id, false, false);
    },
    [applySelection, files, selectedIndex],
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
  }, [navigate, onSelectedIdsChange, t]);

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

  const handleBatchDelete = useCallback(async () => {
    const selected = files.filter(file => selectedIds.includes(file.id));
    if (selected.length === 0) return;
    if (
      !confirm(
        t('image.library.confirmDeleteN').replace(
          '{count}',
          String(selected.length),
        ),
      )
    ) {
      return;
    }
    if (selected.length === 1 && onDeleteImage) {
      await onDeleteImage(selected[0].id, selected[0].name);
    } else if (onDeleteMultipleImages) {
      await onDeleteMultipleImages(
        selected.map(file => file.id),
        selected.map(file => file.name),
      );
    }
    onSelectedIdsChange([]);
    setMultiMode(false);
  }, [
    files,
    onDeleteImage,
    onDeleteMultipleImages,
    onSelectedIdsChange,
    selectedIds,
    t,
  ]);

  const handleBatchDownload = useCallback(() => {
    const selected = files.filter(file => selectedIds.includes(file.id));
    for (const file of selected) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      link.rel = 'noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  }, [files, selectedIds]);

  const clearLongPress = () => {
    if (longPressRef.current != null) {
      window.clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  useEffect(() => {
    if (!contextMenu) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setContextMenu(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [contextMenu]);

  const selectedFolderPath = useUIStore(state => state.selectedFolderPath);
  const showEmpty = !loading && files.length === 0;
  const isFilteredEmpty = showEmpty && Boolean(search?.searchQuery);
  const isFolderEmpty =
    showEmpty && !isFilteredEmpty && Boolean(selectedFolderPath);
  const tableWindow = useMemo(
    () =>
      getVirtualWindow({
        total: files.length,
        scrollTop,
        viewportHeight,
        rowHeight: LIBRARY_ROW_HEIGHT,
      }),
    [files.length, scrollTop, viewportHeight],
  );
  const visibleFiles = files.slice(tableWindow.start, tableWindow.end);

  useEffect(() => {
    const el = tableWrapRef.current;
    if (!el) return;
    const update = () => setViewportHeight(el.clientHeight || 480);
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [showEmpty, loading, files.length]);

  const showBatchBar = selectedIds.length >= 2;
  const allImagesSelected =
    selectedIds.length > 0 &&
    files
      .filter(file => selectedIds.includes(file.id))
      .every(file => getAssetKind(file) === 'image');

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
          {loading ? (
            <span className="asset-library-loading-indicator">
              <span
                className="asset-library-loading-spinner-inline"
                aria-hidden
              />
              <span>{t('image.library.loading')}</span>
            </span>
          ) : (
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
            images={images}
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

      <div className="asset-library-content">
        {loading && files.length === 0 ? (
          <div className="asset-library-loading" aria-busy="true">
            <BrandPixelMark variant="loading" size={72} />
            <p className="mt-3 text-sm text-gray-500">
              {t('image.library.loading')}
            </p>
          </div>
        ) : showEmpty ? (
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
        ) : (
          <div
            className="asset-library-table-wrap"
            ref={tableWrapRef}
            onScroll={event => setScrollTop(event.currentTarget.scrollTop)}
          >
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
                {tableWindow.offsetTop > 0 ? (
                  <tr aria-hidden className="asset-library-spacer">
                    <td
                      colSpan={4}
                      style={{
                        height: tableWindow.offsetTop,
                        padding: 0,
                        border: 0,
                      }}
                    />
                  </tr>
                ) : null}
                {visibleFiles.map(file => {
                  const selected = selectedIds.includes(file.id);
                  const published = Boolean(
                    sourceId && isAssetPublished(file.id, sourceId),
                  );
                  const synced =
                    file.linkKind === 'remote-raw' ||
                    hasPublishableRemoteUrl(file);
                  return (
                    <tr
                      key={file.id}
                      data-file-id={file.id}
                      className={`asset-library-row ${selected ? 'asset-library-row--selected' : ''}`}
                      aria-selected={selected}
                      onClick={event => {
                        if (longPressFiredRef.current) {
                          longPressFiredRef.current = false;
                          return;
                        }
                        applySelection(
                          file.id,
                          event.metaKey || event.ctrlKey,
                          event.shiftKey,
                        );
                      }}
                      onContextMenu={event => {
                        event.preventDefault();
                        setContextMenu({
                          x: event.clientX,
                          y: event.clientY,
                          file,
                        });
                      }}
                      onPointerDown={event => {
                        if (event.pointerType !== 'touch') return;
                        longPressFiredRef.current = false;
                        clearLongPress();
                        longPressRef.current = window.setTimeout(() => {
                          longPressFiredRef.current = true;
                          applySelection(file.id, true, false, true);
                        }, LONG_PRESS_MS);
                      }}
                      onPointerUp={clearLongPress}
                      onPointerCancel={clearLongPress}
                      onPointerMove={clearLongPress}
                    >
                      <td>
                        <div className="asset-library-name-cell">
                          <AssetThumb item={file} />
                          <span
                            className="asset-library-name-text"
                            title={file.name}
                          >
                            {file.name}
                          </span>
                          <span className="asset-library-badges">
                            <span
                              className="asset-library-badge asset-library-badge--local"
                              title={t('image.library.badgeLocal')}
                            >
                              <HardDrive size={10} aria-hidden />
                            </span>
                            <span
                              className={`asset-library-badge ${synced ? 'asset-library-badge--synced' : 'asset-library-badge--local-only'}`}
                              title={
                                synced
                                  ? t('image.inspector.syncRemote')
                                  : t('image.inspector.syncLocal')
                              }
                            >
                              <Cloud size={10} aria-hidden />
                            </span>
                            {published ? (
                              <span
                                className="asset-library-badge asset-library-badge--public"
                                title={t('image.inspector.accessPublic')}
                              >
                                <Globe size={10} aria-hidden />
                              </span>
                            ) : null}
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
                {tableWindow.offsetBottom > 0 ? (
                  <tr aria-hidden className="asset-library-spacer">
                    <td
                      colSpan={4}
                      style={{
                        height: tableWindow.offsetBottom,
                        padding: 0,
                        border: 0,
                      }}
                    />
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showBatchBar ? (
        <div className="asset-library-batch" role="toolbar">
          <span className="asset-library-batch-count">
            {t('image.library.selectedCount').replace(
              '{count}',
              String(selectedIds.length),
            )}
          </span>
          <button
            type="button"
            className="asset-library-chrome-btn"
            onClick={handleBatchDownload}
          >
            {t('image.library.batchDownload')}
          </button>
          <button
            type="button"
            className="asset-library-chrome-btn"
            onClick={onSync}
            disabled={!onSync}
          >
            <RefreshCw size={16} aria-hidden />
            {t('image.toolbar.sync')}
          </button>
          <button
            type="button"
            className="asset-library-chrome-btn"
            onClick={() => onOpenAccess?.(selectedIds[0], selectedIds)}
            disabled={!onOpenAccess}
          >
            {t('image.toolbar.access')}
          </button>
          <button
            type="button"
            className="asset-library-chrome-btn"
            disabled={!allImagesSelected || !onSendCompress}
            title={
              allImagesSelected ? undefined : t('image.inspector.toolImageOnly')
            }
            onClick={() => {
              if (!allImagesSelected) return;
              onSendCompress?.();
            }}
          >
            {t('image.inspector.sendCompress')}
          </button>
          <button
            type="button"
            className="asset-library-chrome-btn"
            disabled={!allImagesSelected || !onSendConvert}
            title={
              allImagesSelected ? undefined : t('image.inspector.toolImageOnly')
            }
            onClick={() => {
              if (!allImagesSelected) return;
              onSendConvert?.();
            }}
          >
            <Wand2 size={16} aria-hidden />
            {t('image.inspector.sendConvert')}
          </button>
          <button
            type="button"
            className="asset-library-chrome-btn asset-library-batch-delete"
            onClick={() => void handleBatchDelete()}
            disabled={!onDeleteImage && !onDeleteMultipleImages}
          >
            <Trash2 size={16} aria-hidden />
            {t('image.library.deleteSelected')}
          </button>
          <button
            type="button"
            className="asset-library-chrome-btn"
            onClick={() => {
              setMultiMode(false);
              onSelectedIdsChange([]);
            }}
          >
            {t('image.library.clearSelection')}
          </button>
        </div>
      ) : null}

      {contextMenu ? (
        <>
          <button
            type="button"
            className="asset-library-menu-backdrop"
            aria-label={t('image.actions.dismissMenu')}
            onClick={() => setContextMenu(null)}
          />
          <div
            className="asset-library-menu"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 176),
              top: Math.min(contextMenu.y, window.innerHeight - 148),
            }}
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onOpenAccess?.(contextMenu.file.id);
                setContextMenu(null);
              }}
            >
              {t('image.inspector.openAccess')}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onSync?.();
                setContextMenu(null);
              }}
            >
              {t('image.toolbar.sync')}
            </button>
            <button
              type="button"
              role="menuitem"
              className="asset-library-menu-danger"
              onClick={() => {
                const file = contextMenu.file;
                setContextMenu(null);
                if (
                  onDeleteImage &&
                  confirm(
                    `${t('image.grid.confirmDelete')} "${file.name}"？${t('image.grid.confirmDeleteLocalHint')}`,
                  )
                ) {
                  void onDeleteImage(file.id, file.name);
                }
              }}
            >
              {t('image.actions.delete')}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
};
