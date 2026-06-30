import { useSearchContextSafe } from '@/contexts/SearchContext';
import {
  WorkspaceMigrationWizard,
  WorkspacePhotosEmptyState,
} from '@/features/workspace';
import { ImageContent } from '@/features/image-content/ImageContent';
import { useImageOperations } from '@/hooks/useImageOperations';
import { useI18n } from '@/i18n/useI18n';
import { useImageStore } from '@/stores/imageStore';
import { useSourceStore } from '@/stores/sourceStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { isWorkspaceAvailable } from '@/platforms/workspacePlatform';
import type { ImageBrowserSearchConfig } from '@pixuli/ui';
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
  const needsSetup = useWorkspaceStore(state => state.needsWorkspaceSetup());
  const localActive = useWorkspaceStore(state => state.isLocalActive());
  const { handleDeleteImage, handleDeleteMultipleImages, handleUpdateImage } =
    useImageOperations();
  const searchContext = useSearchContextSafe();

  const showMigration = needsSetup && sources.length > 0;
  const showSetup = needsSetup && sources.length === 0;
  const hasConfig = isWorkspaceAvailable() ? localActive : sources.length > 0;

  const search = useMemo<ImageBrowserSearchConfig | undefined>(() => {
    if (!searchContext) {
      return undefined;
    }
    return {
      searchQuery: searchContext.searchQuery,
      onSearchChange: searchContext.setSearchQuery,
      filters: searchContext.filters,
      onFiltersChange: searchContext.setFilters,
      history: searchContext.history,
      onSelectHistory: searchContext.handleSelectHistory,
      onDeleteHistory: searchContext.handleDeleteHistory,
      onClearHistory: searchContext.handleClearHistory,
      onSaveHistory: searchContext.handleSaveHistory,
    };
  }, [searchContext]);

  if (showMigration) {
    return (
      <div className="photos-page h-full flex flex-col overflow-hidden">
        <WorkspaceMigrationWizard />
      </div>
    );
  }

  if (showSetup) {
    return (
      <div className="photos-page h-full flex flex-col overflow-hidden">
        <WorkspacePhotosEmptyState />
      </div>
    );
  }

  return (
    <div className="photos-page h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <ImageContent
          hasConfig={hasConfig}
          error={error}
          onClearError={clearError}
          images={images}
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
