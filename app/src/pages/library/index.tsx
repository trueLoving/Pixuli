import { useSearchContextSafe } from '@/features/library/SearchContext';
import { LibraryWorkbench } from '@/features/library/LibraryWorkbench';
import { useImageOperations } from '@/features/library/useImageOperations';
import { useI18n } from '@/i18n/useI18n';
import { useImageStore } from '@/stores/imageStore';
import { useSourceStore } from '@/stores/sourceStore';
import { useUIStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { isWorkspaceAvailable } from '@/platforms/workspacePlatform';
import { filterImagesByFolder } from '@/features/workspace/folderTree';
import type { LibrarySearchConfig } from '@/features/library/librarySearchTypes';
import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

interface LibraryPageProps {
  onOpenConfigModal: () => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({
  onOpenConfigModal,
}) => {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const images = useImageStore(state => state.images);
  const loading = useImageStore(state => state.loading);
  const error = useImageStore(state => state.error);
  const clearError = useImageStore(state => state.clearError);
  const { sources } = useSourceStore();
  const localActive = useWorkspaceStore(state => state.isLocalActive());
  const selectedFolderPath = useUIStore(state => state.selectedFolderPath);
  const setCurrentUtilityTool = useUIStore(
    state => state.setCurrentUtilityTool,
  );
  const setActiveMenu = useUIStore(state => state.setActiveMenu);
  const { handleDeleteImage, handleDeleteMultipleImages, handleUpdateImage } =
    useImageOperations();
  const searchContext = useSearchContextSafe();

  const hasConfig = isWorkspaceAvailable() ? localActive : sources.length > 0;

  const visibleImages = useMemo(
    () => filterImagesByFolder(images, selectedFolderPath),
    [images, selectedFolderPath],
  );

  const search = useMemo<LibrarySearchConfig | undefined>(() => {
    if (!searchContext) {
      return undefined;
    }
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
    };
  }, [searchContext]);

  useEffect(() => {
    const tool = searchParams.get('tool');
    if (tool !== 'compress' && tool !== 'convert') {
      return;
    }
    setCurrentUtilityTool(tool);
    setActiveMenu(tool);
    const next = new URLSearchParams(searchParams);
    next.delete('tool');
    setSearchParams(next, { replace: true });
  }, [searchParams, setActiveMenu, setCurrentUtilityTool, setSearchParams]);

  return (
    <div className="library-page h-full min-h-0 flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-hidden">
        <LibraryWorkbench
          hasConfig={hasConfig}
          error={error}
          onClearError={clearError}
          images={visibleImages}
          loading={loading}
          onDeleteImage={handleDeleteImage}
          onDeleteMultipleImages={handleDeleteMultipleImages}
          onUpdateImage={handleUpdateImage}
          onOpenConfigModal={onOpenConfigModal}
          search={search}
          t={t}
        />
      </div>
    </div>
  );
};

export default LibraryPage;

/** @deprecated 使用 LibraryPage */
export const PhotosPage = LibraryPage;
