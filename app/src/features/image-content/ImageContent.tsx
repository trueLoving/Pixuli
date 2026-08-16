import { EmptyState, ImageBrowser } from '@/ui';
import type { ImageBrowserSearchConfig } from '@/ui';
import { formatFileSize, getImageDimensionsFromUrl } from '@pixuli/core/utils';
import type { ImageItem } from '@pixuli/core/types';
import React, { useCallback, useMemo } from 'react';
import { hasPublishableRemoteUrl } from '../access/accessCapabilities';
import { isAssetPublished } from '../access/accessPolicyStore';
import { useMobileViewport } from '@/hooks/useMobileViewport';
import { isWorkspaceAvailable } from '../../platforms/workspacePlatform';
import { useImageCopyUrl } from '../../hooks/useImageCopyUrl';
import {
  useNativeImagePickers,
  useNativeShareImage,
} from '../../hooks/useNativeImageActions';
import { useImageStore } from '../../stores/imageStore';
import { useSourceStore } from '../../stores/sourceStore';
import { useUIStore } from '../../stores/uiStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';

interface ImageContentProps {
  hasConfig: boolean;
  error: string | null;
  onClearError: () => void;
  images: any[];
  loading: boolean;
  onDeleteImage: (imageId: string, fileName: string) => Promise<void>;
  onDeleteMultipleImages: (
    imageIds: string[],
    fileNames: string[],
  ) => Promise<void>;
  onUpdateImage: (data: any) => Promise<void>;
  onOpenConfigModal: () => void;
  t: (key: string, options?: Record<string, any>) => string;
  search?: ImageBrowserSearchConfig;
}

function resolveImageErrorMessage(
  error: string,
  t: (key: string, options?: Record<string, any>) => string,
): string {
  if (error.includes('|')) {
    const [key, provider] = error.split('|');
    return t(key, { provider });
  }
  if (error.startsWith('errors.')) {
    return t(error);
  }
  return error;
}

export const ImageContent: React.FC<ImageContentProps> = ({
  hasConfig,
  error,
  onClearError,
  images,
  loading,
  onDeleteImage,
  onDeleteMultipleImages,
  onUpdateImage,
  onOpenConfigModal,
  t,
  search,
}) => {
  const uploadImage = useImageStore(state => state.uploadImage);
  const uploadMultipleImages = useImageStore(
    state => state.uploadMultipleImages,
  );
  const batchUploadProgress = useImageStore(state => state.batchUploadProgress);
  const imageLoading = useImageStore(state => state.loading);
  const loadImages = useImageStore(state => state.loadImages);
  const workspaceMode = useWorkspaceStore(state => state.mode);
  const workspaceLoading = useWorkspaceStore(state => state.loading);
  const localActive = isWorkspaceAvailable() && workspaceMode === 'local';
  const uploadLoading = localActive ? workspaceLoading : imageLoading;
  const onCopyUrl = useImageCopyUrl();
  const nativePickers = useNativeImagePickers();
  const onShareImage = useNativeShareImage();
  const isMobile = useMobileViewport();
  const sources = useSourceStore(state => state.sources);
  const selectedSourceId = useSourceStore(state => state.selectedSourceId);
  const pushing = useWorkspaceStore(state => state.pushing);
  const syncing = useWorkspaceStore(state => state.syncing);
  const requestSync = useUIStore(state => state.requestSync);
  const openAccessModal = useUIStore(state => state.openAccessModal);
  const setWorkspaceExplorerOpen = useUIStore(
    state => state.setWorkspaceExplorerOpen,
  );
  const syncBusy = pushing || syncing || workspaceLoading;
  const syncDisabled = syncBusy;

  const errorMessage = useMemo(
    () => (error ? resolveImageErrorMessage(error, t) : null),
    [error, t],
  );

  const handleRetry = useCallback(() => {
    onClearError();
    void loadImages();
  }, [loadImages, onClearError]);

  const handleCopyRemoteAccess = useCallback(
    (image: ImageItem) => {
      const sourceId = selectedSourceId ?? sources[0]?.id;
      if (
        sourceId &&
        isAssetPublished(image.id, sourceId) &&
        hasPublishableRemoteUrl(image)
      ) {
        return true;
      }
      openAccessModal(image.id);
      return false;
    },
    [openAccessModal, selectedSourceId, sources],
  );

  if (!hasConfig) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <EmptyState
          onAddGitHub={() => {
            useImageStore.setState({ storageType: 'github' });
            onOpenConfigModal();
          }}
          onAddGitee={() => {
            useImageStore.setState({ storageType: 'gitee' });
            onOpenConfigModal();
          }}
          t={t}
        />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
      <div className="min-h-0">
        <ImageBrowser
          t={t}
          images={images}
          hasConfig={hasConfig}
          search={search}
          loading={loading}
          errorMessage={errorMessage}
          onDismissError={onClearError}
          onRetry={handleRetry}
          onDeleteImage={onDeleteImage}
          onDeleteMultipleImages={onDeleteMultipleImages}
          onUpdateImage={onUpdateImage}
          onUploadImage={uploadImage}
          onUploadMultipleImages={uploadMultipleImages}
          uploadLoading={uploadLoading}
          batchUploadProgress={batchUploadProgress}
          getImageDimensionsFromUrl={getImageDimensionsFromUrl}
          formatFileSize={formatFileSize}
          onCopyUrl={onCopyUrl}
          onCopyRemoteAccess={handleCopyRemoteAccess}
          nativePickers={nativePickers}
          onShareImage={onShareImage}
          onSync={() => requestSync()}
          syncBusy={syncBusy}
          syncDisabled={syncDisabled}
          onOpenFolders={
            isMobile ? () => setWorkspaceExplorerOpen(true) : undefined
          }
        />
      </div>
    </div>
  );
};
