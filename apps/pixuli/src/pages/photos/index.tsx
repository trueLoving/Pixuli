import { useSearchContextSafe } from '@/contexts/SearchContext';
import { ImageContent } from '@/features/image-content/ImageContent';
import {
  WorkspaceMigrationWizard,
  WorkspaceSetupPanel,
  WorkspaceToolbar,
} from '@/features/workspace';
import { useImageOperations } from '@/hooks/useImageOperations';
import { useI18n } from '@/i18n/useI18n';
import { useImageStore } from '@/stores/imageStore';
import { useSourceStore } from '@/stores/sourceStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { createDefaultFilters, filterImages } from '@pixuli/core/utils';
import React, { useEffect, useMemo, useRef } from 'react';

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
  const searchContextRef = useRef(searchContext);

  const showMigration = needsSetup && sources.length > 0;
  const showSetup = needsSetup && sources.length === 0;
  const hasConfig = sources.length > 0 || localActive;

  useEffect(() => {
    searchContextRef.current = searchContext;
  }, [searchContext]);

  useEffect(() => {
    if (searchContextRef.current) {
      searchContextRef.current.setShowSearch(true);
      return () => {
        if (searchContextRef.current) {
          searchContextRef.current.setShowSearch(false);
        }
      };
    }
  }, []);

  const searchQuery = searchContext?.searchQuery ?? '';
  const setFiltersRef = useRef(searchContext?.setFilters);

  useEffect(() => {
    setFiltersRef.current = searchContext?.setFilters;
  }, [searchContext?.setFilters]);

  useEffect(() => {
    if (!setFiltersRef.current) return;

    const currentQuery = searchQuery;
    setFiltersRef.current(prev => {
      if (prev.searchTerm === currentQuery) {
        return prev;
      }
      return {
        ...prev,
        searchTerm: currentQuery,
      };
    });
  }, [searchQuery]);

  const filteredImages = useMemo(() => {
    if (!searchContext) {
      return filterImages(images, createDefaultFilters());
    }
    return filterImages(images, searchContext.filters);
  }, [images, searchContext]);

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
        <WorkspaceSetupPanel />
      </div>
    );
  }

  return (
    <div className="photos-page h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {localActive && (
          <div className="px-4 pt-4 sm:px-6 lg:px-8">
            <WorkspaceToolbar />
          </div>
        )}
        <ImageContent
          hasConfig={hasConfig}
          error={error}
          onClearError={clearError}
          images={filteredImages}
          loading={loading}
          onDeleteImage={handleDeleteImage}
          onDeleteMultipleImages={handleDeleteMultipleImages}
          onUpdateImage={handleUpdateImage}
          onOpenConfigModal={onOpenConfigModal}
          t={t}
        />
      </div>
    </div>
  );
};

export default PhotosPage;
