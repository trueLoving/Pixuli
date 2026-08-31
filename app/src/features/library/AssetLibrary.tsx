import {
  ContentFeedback,
  keyboardManager,
  COMMON_SHORTCUTS,
  SHORTCUT_CATEGORIES,
} from '@/ui';
import type { UploadButtonHandle } from './UploadButton';
import type { LibrarySearchConfig } from './librarySearchTypes';
import type { NativeImagePickers } from './image-upload/nativePickers';
import { useSourceStore } from '@/features/settings/sourceStore';
import { useUIStore } from '@/stores/uiStore';
import { filterByLibraryQuery } from '@/features/library/utils/libraryQuery';
import {
  nextSelectedIds,
  pruneSelectedIds,
} from '@/features/library/utils/librarySelection';
import { BrandPixelMark } from '@/ui/brand/BrandPixelMark';
import {
  getVirtualWindow,
  LIBRARY_ROW_HEIGHT,
} from '@/features/library/utils/virtualWindow';
import { AssetLibraryStatusBar } from './AssetLibraryStatusBar';
import { sumListedFileSize } from './libraryListStats';
import { SelectionActionBar } from './SelectionActionBar';
import { AssetLibraryContextMenu } from './AssetLibraryContextMenu';
import { AssetLibraryEmptyState } from './AssetLibraryEmptyState';
import { AssetLibraryTable } from './AssetLibraryTable';
import { AssetLibraryToolbar } from './AssetLibraryToolbar';
import type { CompactAction } from '@/features/inspector/inspectorTypes';
import type {
  BatchUploadProgress,
  ImageItem,
  ImageUploadData,
  MultiImageUploadData,
  SortField,
  SortOrder,
} from '@pixuli/core/types';
import { getSortedImages } from '@pixuli/core/utils';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import './AssetLibrary.css';

interface AssetLibraryProps {
  images: ImageItem[];
  hasConfig?: boolean;
  search?: LibrarySearchConfig;
  t: (key: string) => string;
  onUploadImage?: (data: ImageUploadData) => Promise<unknown>;
  onUploadMultipleImages?: (data: MultiImageUploadData) => Promise<unknown>;
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
  onOpenAccess?: (imageId: string) => void;
  onSync?: () => void;
  multiSelectMode?: boolean;
  onMultiSelectModeChange?: (active: boolean) => void;
  showSelectionActionBar?: boolean;
  selectionActions?: { grid: CompactAction[]; danger: CompactAction | null };
  onClearSelection?: () => void;
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
  onOpenAccess,
  onSync,
  multiSelectMode = false,
  onMultiSelectModeChange,
  showSelectionActionBar = false,
  selectionActions = { grid: [], danger: null },
  onClearSelection,
}) => {
  const sources = useSourceStore(state => state.sources);
  const selectedSourceId = useSourceStore(state => state.selectedSourceId);
  const sourceId = selectedSourceId ?? sources[0]?.id;
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    file: ImageItem;
  } | null>(null);
  const anchorIdRef = useRef<string | null>(null);
  const longPressRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);
  const tableWrapRef = useRef<HTMLDivElement>(null);
  const uploadButtonRef = useRef<UploadButtonHandle>(null);
  const [libraryDragOver, setLibraryDragOver] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(480);

  const setMultiSelectActive = useCallback(
    (active: boolean) => {
      onMultiSelectModeChange?.(active);
    },
    [onMultiSelectModeChange],
  );

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
    }
  }, [files, onSelectedIdsChange, selectedIds, visibleIds]);

  const applySelection = useCallback(
    (
      clickedId: string,
      additive: boolean,
      range: boolean,
      enterMulti = false,
    ) => {
      if (enterMulti) setMultiSelectActive(true);
      const next = nextSelectedIds({
        visibleIds,
        selectedIds,
        clickedId,
        additive,
        range,
        anchorId: anchorIdRef.current,
        multiMode: enterMulti || multiSelectMode,
      });
      anchorIdRef.current = next.anchorId;
      const selectedItems = next.selectedIds
        .map(id => files.find(file => file.id === id))
        .filter((item): item is ImageItem => Boolean(item));
      onSelectedIdsChange(next.selectedIds, selectedItems);
      if (
        next.selectedIds.length <= 1 &&
        !enterMulti &&
        !additive &&
        !range &&
        !multiSelectMode
      ) {
        setMultiSelectActive(false);
      }
      requestAnimationFrame(() => {
        document
          .querySelector(`[data-file-id="${clickedId}"]`)
          ?.scrollIntoView({ block: 'nearest' });
      });
    },
    [
      files,
      multiSelectMode,
      onSelectedIdsChange,
      selectedIds,
      visibleIds,
      setMultiSelectActive,
    ],
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

  const canAcceptLibraryDrop = Boolean(onUploadImage && onUploadMultipleImages);

  const handleLibraryDragEnter = useCallback(
    (event: React.DragEvent) => {
      if (!canAcceptLibraryDrop) return;
      if (![...event.dataTransfer.types].includes('Files')) return;
      event.preventDefault();
      setLibraryDragOver(true);
    },
    [canAcceptLibraryDrop],
  );

  const handleLibraryDragOver = useCallback(
    (event: React.DragEvent) => {
      if (!canAcceptLibraryDrop) return;
      if (![...event.dataTransfer.types].includes('Files')) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    },
    [canAcceptLibraryDrop],
  );

  const handleLibraryDragLeave = useCallback(
    (event: React.DragEvent) => {
      if (!canAcceptLibraryDrop) return;
      const next = event.relatedTarget as Node | null;
      if (next && event.currentTarget.contains(next)) return;
      setLibraryDragOver(false);
    },
    [canAcceptLibraryDrop],
  );

  const handleLibraryDrop = useCallback(
    (event: React.DragEvent) => {
      if (!canAcceptLibraryDrop) return;
      event.preventDefault();
      setLibraryDragOver(false);
      const files = Array.from(event.dataTransfer.files);
      if (files.length === 0) return;
      uploadButtonRef.current?.openWithFiles(files);
    },
    [canAcceptLibraryDrop],
  );

  const handleToggleSelectMode = useCallback(() => {
    if (multiSelectMode) {
      setMultiSelectActive(false);
      onClearSelection?.();
      onSelectedIdsChange([]);
      return;
    }
    setMultiSelectActive(true);
    onSelectedIdsChange([]);
  }, [
    multiSelectMode,
    onClearSelection,
    onSelectedIdsChange,
    setMultiSelectActive,
  ]);

  const handleClearSelectionFromBar = useCallback(() => {
    setMultiSelectActive(false);
    onClearSelection?.();
    onSelectedIdsChange([]);
  }, [onClearSelection, onSelectedIdsChange, setMultiSelectActive]);

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

  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));

  const handleToggleSelectAll = useCallback(() => {
    if (allVisibleSelected) {
      onSelectedIdsChange([]);
      return;
    }
    const selectedItems = visibleIds
      .map(id => files.find(file => file.id === id))
      .filter((item): item is ImageItem => Boolean(item));
    onSelectedIdsChange(visibleIds, selectedItems);
  }, [allVisibleSelected, files, onSelectedIdsChange, visibleIds]);

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

  const listedTotalSize = useMemo(() => sumListedFileSize(files), [files]);
  const isFilteredList =
    Boolean(search?.searchQuery) && files.length !== images.length;
  const showStatusBar = files.length > 0;

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

      <AssetLibraryToolbar
        hasConfig={hasConfig}
        search={search}
        t={t}
        onOpenFolders={onOpenFolders}
        onUploadImage={onUploadImage}
        onUploadMultipleImages={onUploadMultipleImages}
        uploadLoading={uploadLoading}
        batchUploadProgress={batchUploadProgress}
        nativePickers={nativePickers}
        selectedFolderPath={selectedFolderPath}
        uploadButtonRef={uploadButtonRef}
        multiSelectMode={multiSelectMode}
        onToggleSelectMode={handleToggleSelectMode}
      />

      <div
        className={`asset-library-content${libraryDragOver ? ' is-drag-over' : ''}${showStatusBar ? ' has-status-bar' : ''}`}
        onDragEnter={handleLibraryDragEnter}
        onDragOver={handleLibraryDragOver}
        onDragLeave={handleLibraryDragLeave}
        onDrop={handleLibraryDrop}
      >
        {libraryDragOver ? (
          <div className="asset-library-drop-hint" aria-hidden>
            {t('image.upload.dragActive')}
          </div>
        ) : null}
        {loading && files.length === 0 ? (
          <div className="asset-library-loading" aria-busy="true">
            <BrandPixelMark variant="loading" size={72} />
            <p className="mt-3 text-sm text-gray-500">
              {t('image.library.loading')}
            </p>
          </div>
        ) : showEmpty ? (
          <AssetLibraryEmptyState
            isFilteredEmpty={isFilteredEmpty}
            isFolderEmpty={isFolderEmpty}
            t={t}
          />
        ) : (
          <AssetLibraryTable
            visibleFiles={visibleFiles}
            tableWindow={tableWindow}
            sortField={sortField}
            sortOrder={sortOrder}
            selectedIds={selectedIds}
            multiSelectMode={multiSelectMode}
            allVisibleSelected={allVisibleSelected}
            onToggleSelectAll={handleToggleSelectAll}
            sourceId={sourceId}
            tableWrapRef={tableWrapRef}
            t={t}
            onSort={handleSort}
            onScroll={setScrollTop}
            onSelect={applySelection}
            onContextMenu={(event, file) => {
              event.preventDefault();
              setContextMenu({
                x: event.clientX,
                y: event.clientY,
                file,
              });
            }}
            onTouchPointerDown={fileId => {
              longPressFiredRef.current = false;
              clearLongPress();
              longPressRef.current = window.setTimeout(() => {
                longPressFiredRef.current = true;
                applySelection(fileId, true, false, true);
              }, 480);
            }}
            onTouchPointerEnd={clearLongPress}
            longPressFiredRef={longPressFiredRef}
          />
        )}
        {showStatusBar ? (
          <AssetLibraryStatusBar
            filesCount={files.length}
            totalCount={images.length}
            totalSize={listedTotalSize}
            selectedCount={selectedIds.length}
            loading={loading}
            isFiltered={isFilteredList}
            t={t}
          />
        ) : null}
      </div>

      {showSelectionActionBar ? (
        <SelectionActionBar
          selectedCount={selectedIds.length}
          actions={selectionActions}
          compact
          t={t}
          onClearSelection={handleClearSelectionFromBar}
        />
      ) : null}

      {contextMenu ? (
        <AssetLibraryContextMenu
          menu={contextMenu}
          t={t}
          onClose={() => setContextMenu(null)}
          onOpenAccess={onOpenAccess}
          onSync={onSync}
          onDeleteImage={onDeleteImage}
        />
      ) : null}
    </div>
  );
};
