import { useSearchContextSafe } from '@/features/library/SearchContext';
import { useImageOperations } from '@/features/library/useImageOperations';
import { useImageStore } from '@/features/library/imageStore';
import type { LibrarySearchConfig } from '@/features/library/librarySearchTypes';
import { useSourceStore } from '@/features/settings/sourceStore';
import { useWorkspaceStore } from '@/features/workspace/workspaceStore';
import { useI18n } from '@/i18n/useI18n';
import { isWorkspaceAvailable } from '@/platforms/workspacePlatform';
import { useUIStore } from '@/stores/uiStore';
import { shouldResetOnFolderChange } from '@/features/library/utils/folderScopeReset';
import { useEffect, useMemo, useRef } from 'react';

/** `/library` 路由：store 接线、文件夹过滤、搜索适配 */
export function useLibraryRoute() {
  const { t } = useI18n();
  const images = useImageStore(state => state.images);
  const loadImages = useImageStore(state => state.loadImages);
  const loading = useImageStore(state => state.loading);
  const error = useImageStore(state => state.error);
  const clearError = useImageStore(state => state.clearError);
  const { sources } = useSourceStore();
  const localActive = useWorkspaceStore(state => state.isLocalActive());
  const selectedFolderPath = useUIStore(state => state.selectedFolderPath);
  const {
    handleDeleteImage,
    handleDeleteMultipleImages,
    handleUpdateImage,
    handleBatchUpdateMetadata,
  } = useImageOperations();
  const searchContext = useSearchContextSafe();

  const hasConfig = isWorkspaceAvailable() ? localActive : sources.length > 0;

  const searchScope = searchContext?.searchScope ?? 'folder';
  const searchQuery = searchContext?.searchQuery ?? '';
  const searchAllWorkspace =
    searchScope === 'workspace' &&
    Boolean(searchQuery.trim()) &&
    Boolean(selectedFolderPath);

  // store 已按文件夹 / 全库搜索范围懒载入，此处直接使用
  const visibleImages = images;

  const clearCommittedSearch = searchContext?.clearCommittedSearch;
  const folderPathForSearchRef = useRef<string | null>(null);
  useEffect(() => {
    const previous = folderPathForSearchRef.current;
    if (shouldResetOnFolderChange(previous, selectedFolderPath)) {
      clearCommittedSearch?.();
    }
    folderPathForSearchRef.current = selectedFolderPath;
  }, [selectedFolderPath, clearCommittedSearch]);

  const pullDirtyFolderIfNeeded = useWorkspaceStore(
    state => state.pullDirtyFolderIfNeeded,
  );

  useEffect(() => {
    if (!localActive) {
      return;
    }
    let cancelled = false;
    void (async () => {
      await pullDirtyFolderIfNeeded(selectedFolderPath);
      if (cancelled) {
        return;
      }
      await loadImages({
        folderPath: selectedFolderPath,
        searchAll: searchAllWorkspace,
        searchQuery: searchQuery.trim() || undefined,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [
    localActive,
    loadImages,
    pullDirtyFolderIfNeeded,
    selectedFolderPath,
    searchAllWorkspace,
    searchQuery,
  ]);

  const search = useMemo<LibrarySearchConfig | undefined>(() => {
    if (!searchContext) {
      return undefined;
    }
    const canSearchInAll = Boolean(selectedFolderPath);
    return {
      searchQuery: searchContext.searchQuery,
      draftQuery: searchContext.draftQuery,
      onDraftChange: searchContext.setDraftQuery,
      onCommitSearch: searchContext.commitSearch,
      onSearchChange: searchContext.setSearchQuery,
      filters: searchContext.filters,
      onFiltersChange: searchContext.setFilters,
      history: searchContext.history,
      onSelectHistory: searchContext.handleSelectHistory,
      onDeleteHistory: searchContext.handleDeleteHistory,
      onClearHistory: searchContext.handleClearHistory,
      searchScope: searchContext.searchScope,
      canSearchInAll,
      onSearchInAll: canSearchInAll
        ? () => searchContext.setSearchScope('workspace')
        : undefined,
      onSearchInFolder: () => searchContext.setSearchScope('folder'),
    };
  }, [searchContext, selectedFolderPath]);

  return {
    t,
    hasConfig,
    error,
    clearError,
    visibleImages,
    loading,
    handleDeleteImage,
    handleDeleteMultipleImages,
    handleUpdateImage,
    handleBatchUpdateMetadata,
    search,
  };
}
