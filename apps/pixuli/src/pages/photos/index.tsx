import { useSearchContextSafe } from '@/contexts/SearchContext';
import { ImageContent } from '@/features/image-content/ImageContent';
import { WorkspaceSetupPanel, WorkspaceToolbar } from '@/features/workspace';
import { useImageOperations } from '@/hooks/useImageOperations';
import { useI18n } from '@/i18n/useI18n';
import { isDesktopWorkspaceAvailable } from '@/platforms/desktop/workspaceAdapter';
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
  const remoteImages = useImageStore(state => state.images);
  const remoteLoading = useImageStore(state => state.loading);
  const remoteError = useImageStore(state => state.error);
  const clearRemoteError = useImageStore(state => state.clearError);
  const { sources } = useSourceStore();
  const workspaceMode = useWorkspaceStore(state => state.mode);
  const localImages = useWorkspaceStore(state => state.localImages);
  const workspaceLoading = useWorkspaceStore(state => state.loading);
  const workspaceError = useWorkspaceStore(state => state.error);
  const clearWorkspaceError = useWorkspaceStore(state => state.clearError);
  const softDeleteLocal = useWorkspaceStore(state => state.softDeleteLocal);
  const { handleDeleteImage, handleDeleteMultipleImages, handleUpdateImage } =
    useImageOperations();
  const searchContext = useSearchContextSafe();
  const searchContextRef = useRef(searchContext);

  const desktopWorkspace = isDesktopWorkspaceAvailable();
  const localActive = desktopWorkspace && workspaceMode === 'local';
  const needsSetup = desktopWorkspace && workspaceMode === 'unset';

  const images = localActive ? localImages : remoteImages;
  const loading = localActive ? workspaceLoading : remoteLoading;
  const error = localActive ? workspaceError : remoteError;
  const clearError = localActive ? clearWorkspaceError : clearRemoteError;
  const hasConfig = localActive ? true : sources.length > 0;

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

  const onDeleteImage = async (imageId: string, fileName: string) => {
    if (localActive) {
      const target = images.find(img => img.id === imageId);
      if (target?.localPath) {
        await softDeleteLocal(target.localPath);
      }
      return;
    }
    await handleDeleteImage(imageId, fileName);
  };

  const onDeleteMultipleImages = async (
    imageIds: string[],
    fileNames: string[],
  ) => {
    if (localActive) {
      for (const id of imageIds) {
        const target = images.find(img => img.id === id);
        if (target?.localPath) {
          await softDeleteLocal(target.localPath);
        }
      }
      return;
    }
    await handleDeleteMultipleImages(imageIds, fileNames);
  };

  if (needsSetup) {
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
          onDeleteImage={onDeleteImage}
          onDeleteMultipleImages={onDeleteMultipleImages}
          onUpdateImage={handleUpdateImage}
          onOpenConfigModal={onOpenConfigModal}
          t={t}
        />
      </div>
    </div>
  );
};

export default PhotosPage;
