import {
  ContentFeedback,
  keyboardManager,
  COMMON_SHORTCUTS,
  SHORTCUT_CATEGORIES,
} from '@/ui';
import type { UploadButtonHandle } from './UploadButton';
import type { LibrarySearchConfig } from './librarySearchTypes';
import type { NativeImagePickers } from './asset-upload/nativePickers';
import { useAssetStore } from '@/features/library/assetStore';
import { useUIStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/features/workspace/workspaceStore';
import { isWorkspaceAvailable } from '@/platforms/workspacePlatform';
import { filterByLibraryQuery } from '@/features/library/utils/libraryQuery';
import {
  nextFocusId,
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
import { LibraryFolderNav } from './LibraryFolderNav';
import { LibrarySearchOverlay } from './LibrarySearchOverlay';
import { TransferImportModal } from '@/features/lan-share/TransferImportModal';
import {
  CLEAR_LIBRARY_SEARCH_EVENT,
  OPEN_LIBRARY_SEARCH_EVENT,
} from './librarySearchEvents';
import {
  areLibraryShortcutsActive,
  hasOpenModalDialog,
  LIBRARY_SHORTCUTS_GATE_EVENT,
  resumeLibraryShortcuts,
  suspendLibraryShortcuts,
} from './libraryShortcutGate';
import {
  libraryChildFolders,
  libraryFolderNavItems,
  normalizeLibraryFolderPath,
  resolveLibraryFolderNavPath,
} from './libraryNavigation';
import { useMobileViewport } from '@/hooks/useMobileViewport';
import { resolveNewFolderParent } from '@/features/workspace/WorkspaceFolderTree';
import type { CompactAction } from '@/features/inspector/inspectorTypes';
import type {
  BatchUploadProgress,
  AssetItem,
  AssetUploadData,
  MultiAssetUploadData,
  SortField,
  SortOrder,
} from '@pixuli/core/types';
import { getSortedAssets } from '@pixuli/core/utils';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import './AssetLibrary.css';

interface AssetLibraryProps {
  assets: AssetItem[];
  hasConfig?: boolean;
  search?: LibrarySearchConfig;
  t: (key: string) => string;
  onUploadAsset?: (data: AssetUploadData) => Promise<unknown>;
  onUploadMultipleAssets?: (data: MultiAssetUploadData) => Promise<unknown>;
  uploadLoading?: boolean;
  batchUploadProgress?: BatchUploadProgress | null;
  nativePickers?: NativeImagePickers;
  loading?: boolean;
  errorMessage?: string | null;
  onDismissError?: () => void;
  onRetry?: () => void;
  onOpenFolders?: () => void;
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[], items?: AssetItem[]) => void;
  onDeleteAsset?: (id: string, name: string) => Promise<void>;
  onCopyLink?: (asset: AssetItem) => void;
  onMoveAsset?: (asset: AssetItem) => void;
  onOpenFile?: (asset: AssetItem) => void;
  onEditFile?: (asset: AssetItem) => void;
  onShareFile?: (asset: AssetItem) => void;
  hasRemoteConnection?: boolean;
  multiSelectMode?: boolean;
  onMultiSelectModeChange?: (active: boolean) => void;
  showSelectionActionBar?: boolean;
  selectionActions?: { grid: CompactAction[]; danger: CompactAction | null };
  onClearSelection?: () => void;
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({
  assets,
  hasConfig = true,
  search,
  t,
  onUploadAsset,
  onUploadMultipleAssets,
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
  onDeleteAsset,
  onCopyLink,
  onMoveAsset,
  onOpenFile,
  onEditFile,
  onShareFile,
  hasRemoteConnection,
  multiSelectMode = false,
  onMultiSelectModeChange,
  showSelectionActionBar = false,
  selectionActions = { grid: [], danger: null },
  onClearSelection,
}) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    file: AssetItem;
  } | null>(null);
  const anchorIdRef = useRef<string | null>(null);
  /** 多选模式键盘焦点（与勾选集合分离） */
  const [focusFileId, setFocusFileId] = useState<string | null>(null);
  const longPressRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);
  const tableWrapRef = useRef<HTMLDivElement>(null);
  const uploadButtonRef = useRef<UploadButtonHandle>(null);
  const [libraryDragOver, setLibraryDragOver] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(480);
  const [activeFolderPath, setActiveFolderPath] = useState<string | null>(null);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [searchOverlayNonce, setSearchOverlayNonce] = useState(0);
  const [transferImportOpen, setTransferImportOpen] = useState(false);
  const [libraryShortcutsActive, setLibraryShortcutsActive] = useState(
    areLibraryShortcutsActive,
  );
  const isMobile = useMobileViewport();

  useEffect(() => {
    const onGate = () => setLibraryShortcutsActive(areLibraryShortcutsActive());
    window.addEventListener(LIBRARY_SHORTCUTS_GATE_EVENT, onGate);
    return () =>
      window.removeEventListener(LIBRARY_SHORTCUTS_GATE_EVENT, onGate);
  }, []);

  useEffect(() => {
    if (!searchOverlayOpen) return;
    suspendLibraryShortcuts();
    return () => resumeLibraryShortcuts();
  }, [searchOverlayOpen]);

  const openSearchOverlay = useCallback(() => {
    if (!search) return;
    const committed = search.searchQuery.trim();
    if (committed && search.draftQuery !== search.searchQuery) {
      search.onDraftChange(search.searchQuery);
    }
    setSearchOverlayOpen(true);
    setSearchOverlayNonce(nonce => nonce + 1);
  }, [search]);

  const clearSearch = useCallback(() => {
    search?.onSearchChange('');
  }, [search]);

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
    const filtered = filterByLibraryQuery(assets, search?.searchQuery ?? '');
    const unique = new Map<string, AssetItem>();
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
    return getSortedAssets([...unique.values()], sortField, sortOrder);
  }, [assets, search?.searchQuery, sortField, sortOrder]);

  const visibleIds = useMemo(() => files.map(file => file.id), [files]);

  useEffect(() => {
    const next = pruneSelectedIds(selectedIds, visibleIds);
    if (next !== selectedIds) {
      const selectedItems = next
        .map(id => files.find(file => file.id === id))
        .filter((item): item is AssetItem => Boolean(item));
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
      setActiveFolderPath(null);
      if (enterMulti || multiSelectMode) {
        setFocusFileId(clickedId);
      }
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
        .filter((item): item is AssetItem => Boolean(item));
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
          .querySelector(`[data-file-id="${CSS.escape(clickedId)}"]`)
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

  const canAcceptLibraryDrop = Boolean(onUploadAsset && onUploadMultipleAssets);

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

  const enterMultiSelectMode = useCallback(() => {
    if (multiSelectMode) return;
    const seed =
      selectedIds.find(id => files.some(file => file.id === id)) ??
      files[0]?.id ??
      null;
    if (seed) setFocusFileId(seed);
    setMultiSelectActive(true);
    onSelectedIdsChange([]);
  }, [
    files,
    multiSelectMode,
    onSelectedIdsChange,
    selectedIds,
    setMultiSelectActive,
  ]);

  const handleToggleSelectMode = useCallback(() => {
    if (multiSelectMode) {
      setMultiSelectActive(false);
      setFocusFileId(null);
      onClearSelection?.();
      onSelectedIdsChange([]);
      return;
    }
    enterMultiSelectMode();
  }, [
    enterMultiSelectMode,
    multiSelectMode,
    onClearSelection,
    onSelectedIdsChange,
    setMultiSelectActive,
  ]);

  const handleClearSelectionFromBar = useCallback(() => {
    setMultiSelectActive(false);
    setFocusFileId(null);
    onClearSelection?.();
    onSelectedIdsChange([]);
  }, [onClearSelection, onSelectedIdsChange, setMultiSelectActive]);

  const clearLongPress = () => {
    if (longPressRef.current != null) {
      window.clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  /**
   * Esc：先关右键菜单，再退出多选。
   * 必须用 document 捕获阶段：全局 Escape 在 document 冒泡里 stopPropagation，
   * window 监听收不到。
   */
  useEffect(() => {
    if (!contextMenu && !multiSelectMode) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (contextMenu) {
        event.preventDefault();
        event.stopPropagation();
        setContextMenu(null);
        return;
      }
      if (!multiSelectMode) return;
      // 搜索浮层 / 模态优先吃掉 Esc
      if (searchOverlayOpen || hasOpenModalDialog()) return;
      event.preventDefault();
      event.stopPropagation();
      handleClearSelectionFromBar();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [
    contextMenu,
    handleClearSelectionFromBar,
    multiSelectMode,
    searchOverlayOpen,
  ]);

  const selectedFolderPath = useUIStore(state => state.selectedFolderPath);
  const setSelectedFolderPath = useUIStore(
    state => state.setSelectedFolderPath,
  );
  const indexPaths = useWorkspaceStore(state => state.indexPaths);
  const localFolders = useWorkspaceStore(state => state.localFolders);
  const createLocalFolder = useWorkspaceStore(state => state.createLocalFolder);
  const workspaceMode = useWorkspaceStore(state => state.mode);
  const localWorkspaceActive =
    isWorkspaceAvailable() && workspaceMode === 'local';

  const handleEmptyAddFiles = useCallback(() => {
    uploadButtonRef.current?.open();
  }, []);

  const handleEmptyNewSubfolder = useCallback(async () => {
    const name = window.prompt(t('workspace.newFolderPrompt'));
    if (!name?.trim()) return;
    const safe = name.trim().replace(/[/\\]/g, '_');
    const parent = resolveNewFolderParent(selectedFolderPath);
    const target = parent ? `${parent}/${safe}` : safe;
    await createLocalFolder(target);
    setSelectedFolderPath(target);
  }, [createLocalFolder, selectedFolderPath, setSelectedFolderPath, t]);

  const childFolders = useMemo(
    () => libraryChildFolders(indexPaths, localFolders, selectedFolderPath),
    [indexPaths, localFolders, selectedFolderPath],
  );
  const folderNavItems = useMemo(
    () => libraryFolderNavItems(childFolders, selectedFolderPath),
    [childFolders, selectedFolderPath],
  );
  const searchActive = Boolean(search?.searchQuery?.trim());
  const canGoUp = Boolean(normalizeLibraryFolderPath(selectedFolderPath));
  const showFolders =
    !loading && !searchActive && (childFolders.length > 0 || canGoUp);
  const showEmpty = !loading && files.length === 0 && childFolders.length === 0;
  const isFilteredEmpty = showEmpty && Boolean(search?.searchQuery);

  /** 进入多选或列表变化时维护键盘焦点；退出时清空 */
  useEffect(() => {
    if (!multiSelectMode) {
      setFocusFileId(null);
      return;
    }
    const ids = files.map(file => file.id);
    setFocusFileId(prev => {
      if (prev && ids.includes(prev)) return prev;
      const fromSelection = [...selectedIds]
        .reverse()
        .find(id => ids.includes(id));
      return fromSelection ?? ids[0] ?? null;
    });
  }, [files, multiSelectMode, selectedIds]);

  const navigate = useCallback(
    (delta: number) => {
      // 多选：↑↓ 只移动焦点，不改勾选集合
      if (multiSelectMode) {
        if (files.length === 0) return;
        const nextId = nextFocusId({
          visibleIds: files.map(file => file.id),
          focusId: focusFileId,
          delta,
        });
        if (!nextId) return;
        setFocusFileId(nextId);
        requestAnimationFrame(() => {
          document
            .querySelector(`[data-file-id="${CSS.escape(nextId)}"]`)
            ?.scrollIntoView({ block: 'nearest' });
        });
        return;
      }

      const folders = showFolders ? folderNavItems : [];
      const folderCount = folders.length;
      const fileCount = files.length;
      const total = folderCount + fileCount;
      if (total === 0) return;

      let index = -1;
      if (activeFolderPath && folderCount > 0) {
        index = folders.findIndex(folder => folder.path === activeFolderPath);
      } else if (selectedIndex >= 0) {
        index = folderCount + selectedIndex;
      }

      const next =
        index < 0
          ? delta > 0
            ? 0
            : total - 1
          : Math.min(total - 1, Math.max(0, index + delta));

      if (next < folderCount) {
        const path = folders[next].path;
        setActiveFolderPath(path);
        onSelectedIdsChange([]);
        requestAnimationFrame(() => {
          const el = document.querySelector(
            `[data-folder-path="${CSS.escape(path)}"]`,
          );
          if (!(el instanceof HTMLElement)) return;
          el.scrollIntoView({ block: 'nearest' });
          el.focus({ preventScroll: true });
        });
        return;
      }

      const active = document.activeElement;
      if (
        active instanceof HTMLElement &&
        active.classList.contains('library-folder-row')
      ) {
        active.blur();
      }
      applySelection(files[next - folderCount].id, false, false);
    },
    [
      activeFolderPath,
      applySelection,
      files,
      focusFileId,
      folderNavItems,
      multiSelectMode,
      onSelectedIdsChange,
      selectedIndex,
      showFolders,
    ],
  );

  const selectedFile = useMemo(() => {
    if (activeFolderPath || selectedIds.length !== 1 || multiSelectMode) {
      return null;
    }
    return files.find(item => item.id === selectedIds[0]) ?? null;
  }, [activeFolderPath, files, multiSelectMode, selectedIds]);

  useEffect(() => {
    if (isMobile || !libraryShortcutsActive) return;
    const shortcuts = [
      {
        key: COMMON_SHORTCUTS.ARROW_UP,
        description: t('keyboard.shortcuts.selectUp'),
        action: () => {
          if (!areLibraryShortcutsActive()) return;
          navigate(-1);
        },
        category: SHORTCUT_CATEGORIES.IMAGE_BROWSER,
      },
      {
        key: COMMON_SHORTCUTS.ARROW_DOWN,
        description: t('keyboard.shortcuts.selectDown'),
        action: () => {
          if (!areLibraryShortcutsActive()) return;
          navigate(1);
        },
        category: SHORTCUT_CATEGORIES.IMAGE_BROWSER,
      },
      {
        key: COMMON_SHORTCUTS.E,
        description: t('keyboard.shortcuts.editSelected'),
        action: () => {
          if (!areLibraryShortcutsActive()) return;
          if (!selectedFile || !onEditFile) return;
          onEditFile(selectedFile);
        },
        category: SHORTCUT_CATEGORIES.IMAGE_BROWSER,
      },
      {
        key: COMMON_SHORTCUTS.S,
        description: t('keyboard.shortcuts.shareSelected'),
        action: () => {
          if (!areLibraryShortcutsActive()) return;
          if (!selectedFile || !onShareFile) return;
          onShareFile(selectedFile);
        },
        category: SHORTCUT_CATEGORIES.IMAGE_BROWSER,
      },
      {
        key: COMMON_SHORTCUTS.M,
        description: t('keyboard.shortcuts.enterMultiSelect'),
        action: () => {
          if (!areLibraryShortcutsActive()) return;
          enterMultiSelectMode();
        },
        category: SHORTCUT_CATEGORIES.IMAGE_BROWSER,
      },
    ];
    keyboardManager.registerBatch(shortcuts);
    return () => {
      shortcuts.forEach(shortcut => keyboardManager.unregister(shortcut));
    };
  }, [
    enterMultiSelectMode,
    isMobile,
    libraryShortcutsActive,
    navigate,
    onEditFile,
    onShareFile,
    selectedFile,
    t,
  ]);

  useEffect(() => {
    setActiveFolderPath(null);
  }, [selectedFolderPath]);

  useEffect(() => {
    const onOpenSearch = () => openSearchOverlay();
    const onClearSearch = () => {
      clearSearch();
      setSearchOverlayOpen(false);
    };
    const onCloseModals = () => setSearchOverlayOpen(false);
    window.addEventListener(OPEN_LIBRARY_SEARCH_EVENT, onOpenSearch);
    window.addEventListener(CLEAR_LIBRARY_SEARCH_EVENT, onClearSearch);
    window.addEventListener('closeModals', onCloseModals);
    return () => {
      window.removeEventListener(OPEN_LIBRARY_SEARCH_EVENT, onOpenSearch);
      window.removeEventListener(CLEAR_LIBRARY_SEARCH_EVENT, onClearSearch);
      window.removeEventListener('closeModals', onCloseModals);
    };
  }, [clearSearch, openSearchOverlay]);

  useEffect(() => {
    if (isMobile || !libraryShortcutsActive) return;
    const onKey = (event: KeyboardEvent) => {
      if (!areLibraryShortcutsActive()) return;
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      // 多选：Space 切换当前焦点行的勾选
      if (event.key === ' ' || event.code === 'Space') {
        if (!multiSelectMode || !focusFileId) return;
        if (
          target.closest(
            'textarea, select, button, a, [contenteditable="true"], [role="dialog"]',
          )
        ) {
          return;
        }
        if (target instanceof HTMLInputElement) {
          // 表头「全选」交给原生；行内 checkbox 仍走焦点勾选
          if (target.closest('thead')) return;
          if (!target.classList.contains('asset-library-row-check')) return;
        }
        event.preventDefault();
        applySelection(focusFileId, false, false);
        return;
      }

      if (event.key !== 'Enter') return;
      if (multiSelectMode) return;
      if (
        target.closest(
          'input, textarea, select, button, a, [contenteditable="true"], [role="dialog"]',
        )
      ) {
        return;
      }
      if (activeFolderPath) {
        event.preventDefault();
        setSelectedFolderPath(
          resolveLibraryFolderNavPath(activeFolderPath, selectedFolderPath),
        );
        return;
      }
      if (!selectedFile) return;
      event.preventDefault();
      onOpenFile?.(selectedFile);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    activeFolderPath,
    applySelection,
    focusFileId,
    isMobile,
    libraryShortcutsActive,
    multiSelectMode,
    onOpenFile,
    selectedFile,
    selectedFolderPath,
    setSelectedFolderPath,
  ]);
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
      .filter((item): item is AssetItem => Boolean(item));
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

  const libraryTotal = useAssetStore(state => state.libraryTotal);
  const matchedTotal = Math.max(libraryTotal, assets.length);
  const listTruncated = matchedTotal > assets.length;
  const listedTotalSize = useMemo(() => sumListedFileSize(files), [files]);
  const isFilteredList =
    Boolean(search?.searchQuery) && files.length !== assets.length;
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
        onOpenSearch={search ? openSearchOverlay : undefined}
        onClearSearch={search ? clearSearch : undefined}
        onUploadAsset={onUploadAsset}
        onUploadMultipleAssets={onUploadMultipleAssets}
        uploadLoading={uploadLoading}
        batchUploadProgress={batchUploadProgress}
        nativePickers={nativePickers}
        selectedFolderPath={selectedFolderPath}
        uploadButtonRef={uploadButtonRef}
        multiSelectMode={multiSelectMode}
        onToggleSelectMode={handleToggleSelectMode}
        onImportTransfer={
          hasConfig && onUploadAsset
            ? () => setTransferImportOpen(true)
            : undefined
        }
      />

      <TransferImportModal
        isOpen={transferImportOpen}
        onClose={() => setTransferImportOpen(false)}
        t={t}
      />

      {search ? (
        <LibrarySearchOverlay
          open={searchOverlayOpen}
          focusNonce={searchOverlayNonce}
          search={search}
          hasConfig={hasConfig}
          t={t}
          onClose={() => setSearchOverlayOpen(false)}
        />
      ) : null}

      {search?.searchQuery && search.canSearchInAll ? (
        <div
          className="asset-library-search-scope"
          role="status"
          aria-live="polite"
        >
          <span>
            {search.searchScope === 'workspace'
              ? t('image.library.searchScopeAll')
              : t('image.library.searchScopeFolder')}
          </span>
          {search.searchScope === 'workspace' && search.onSearchInFolder ? (
            <button
              type="button"
              className="asset-library-search-scope-btn"
              onClick={search.onSearchInFolder}
            >
              {t('image.library.searchInFolder')}
            </button>
          ) : null}
        </div>
      ) : null}

      <div
        className={`asset-library-content${libraryDragOver ? ' is-drag-over' : ''}${showStatusBar ? ' has-status-bar' : ''}${showFolders && files.length > 0 ? ' has-folders' : ''}`}
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
        <LibraryFolderNav
          currentPath={selectedFolderPath}
          folders={folderNavItems}
          showFolders={showFolders}
          solo={showFolders && files.length === 0 && childFolders.length > 0}
          isMobile={isMobile}
          canMutate={localWorkspaceActive}
          t={t}
          highlightedPath={activeFolderPath}
          onHighlightFolder={path => {
            setActiveFolderPath(path);
            onSelectedIdsChange([]);
          }}
          onOpenFolder={setSelectedFolderPath}
        />
        {loading && files.length === 0 && !showFolders ? (
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
            onAddFiles={localWorkspaceActive ? handleEmptyAddFiles : undefined}
            onNewSubfolder={
              localWorkspaceActive ? handleEmptyNewSubfolder : undefined
            }
            onSearchInAll={
              isFilteredEmpty &&
              search?.canSearchInAll &&
              search.searchScope === 'folder'
                ? search.onSearchInAll
                : undefined
            }
          />
        ) : files.length === 0 ? null : (
          <AssetLibraryTable
            visibleFiles={visibleFiles}
            tableWindow={tableWindow}
            sortField={sortField}
            sortOrder={sortOrder}
            selectedIds={selectedIds}
            focusFileId={focusFileId}
            multiSelectMode={multiSelectMode}
            allVisibleSelected={allVisibleSelected}
            onToggleSelectAll={handleToggleSelectAll}
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
            onOpenFile={onOpenFile}
          />
        )}
        {showStatusBar ? (
          <AssetLibraryStatusBar
            filesCount={files.length}
            totalCount={
              listTruncated && !isFilteredList ? matchedTotal : assets.length
            }
            totalSize={listedTotalSize}
            selectedCount={selectedIds.length}
            loading={loading}
            isFiltered={isFilteredList || listTruncated}
            listTruncated={listTruncated}
            matchedTotal={matchedTotal}
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
          onCopyLink={onCopyLink}
          onMoveAsset={onMoveAsset}
          onDeleteAsset={onDeleteAsset}
          hasRemoteConnection={hasRemoteConnection}
        />
      ) : null}
    </div>
  );
};
