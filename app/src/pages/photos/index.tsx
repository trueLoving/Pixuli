import { useSearchContextSafe } from '@/contexts/SearchContext';
import { ImageContent } from '@/features/image-content/ImageContent';
import { useImageOperations } from '@/hooks/useImageOperations';
import { useI18n } from '@/i18n/useI18n';
import { useImageStore } from '@/stores/imageStore';
import { useSourceStore } from '@/stores/sourceStore';
import { useUIStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { isWorkspaceAvailable } from '@/platforms/workspacePlatform';
import { filterImagesByFolder } from '@/utils/workspaceFolderTree';
import type { LibrarySearchConfig } from '@/ui';
import React, { useMemo } from 'react';

interface PhotosPageProps {
  onOpenConfigModal: () => void;
}

export const PhotosPage: React.FC<PhotosPageProps> = ({
  onOpenConfigModal,
}) => {
  const { t } = useI18n();
  const images = useImageStore(state => state.images);
  const loading = useImageStore(state => state.loading);
  const error = useImageStore(state => state.error);
  const clearError = useImageStore(state => state.clearError);
  const { sources } = useSourceStore();
  const localActive = useWorkspaceStore(state => state.isLocalActive());
  const selectedFolderPath = useUIStore(state => state.selectedFolderPath);
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

  return (
    <div className="photos-page h-full min-h-0 flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-hidden">
        <ImageContent
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

export default PhotosPage;
