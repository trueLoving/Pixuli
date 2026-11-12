import { useSearchContextSafe } from '@/features/library/SearchContext';
import { useAssetOperations } from '@/features/library/useAssetOperations';
import { useAssetStore } from '@/features/library/assetStore';
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
  const assets = useAssetStore(state => state.assets);
  const loadAssets = useAssetStore(state => state.loadAssets);
  const loading = useAssetStore(state => state.loading);
  const error = useAssetStore(state => state.error);
  const clearError = useAssetStore(state => state.clearError);
  const { sources } = useSourceStore();
  const localActive = useWorkspaceStore(state => state.isLocalActive());
  const selectedFolderPath = useUIStore(state => state.selectedFolderPath);
  const {
    handleDeleteAsset,
    handleDeleteMultipleAssets,
    handleUpdateAsset,
    handleBatchUpdateMetadata,
  } = useAssetOperations();
  const searchContext = useSearchContextSafe();

  const hasConfig = isWorkspaceAvailable() ? localActive : sources.length > 0;

  const searchScope = searchContext?.searchScope ?? 'folder';
  const searchQuery = searchContext?.searchQuery ?? '';
  const searchAllWorkspace =
    searchScope === 'workspace' &&
    Boolean(searchQuery.trim()) &&
    Boolean(selectedFolderPath);

  // store 已按文件夹 / 全库搜索范围懒载入，此处直接使用
  const visibleAssets = assets;

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
      await loadAssets({
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
    loadAssets,
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
    visibleAssets,
    loading,
    handleDeleteAsset,
    handleDeleteMultipleAssets,
    handleUpdateAsset,
    handleBatchUpdateMetadata,
    search,
  };
}
