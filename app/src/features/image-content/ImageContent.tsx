import { EmptyState } from '@/ui';
import type { LibrarySearchConfig } from '@/ui';
import { getImageDimensionsFromUrl } from '@pixuli/core/utils';
import type { ImageEditData, ImageItem } from '@pixuli/core/types';
import React, { useCallback, useMemo, useState } from 'react';
import { hasPublishableRemoteUrl } from '../access/accessCapabilities';
import { isAssetPublished } from '../access/accessPolicyStore';
import { AssetInspector } from '../inspector/AssetInspector';
import { AssetLibrary } from '../library/AssetLibrary';
import { useMobileViewport, useWideViewport } from '@/hooks/useMobileViewport';
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
import './ImageContent.css';

interface ImageContentProps {
  hasConfig: boolean;
  error: string | null;
  onClearError: () => void;
  images: ImageItem[];
  loading: boolean;
  onDeleteImage: (imageId: string, fileName: string) => Promise<void>;
  onUpdateImage: (data: ImageEditData) => Promise<void>;
  onOpenConfigModal: () => void;
  t: (key: string, options?: Record<string, any>) => string;
  search?: LibrarySearchConfig;
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
  const isWide = useWideViewport();
  const sources = useSourceStore(state => state.sources);
  const selectedSourceId = useSourceStore(state => state.selectedSourceId);
  const openAccessModal = useUIStore(state => state.openAccessModal);
  const setWorkspaceExplorerOpen = useUIStore(
    state => state.setWorkspaceExplorerOpen,
  );

  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const selectedImage = useMemo(
    () => images.find(item => item.id === selectedImageId) ?? null,
    [images, selectedImageId],
  );

  const showDockedInspector = isWide || (!isMobile && Boolean(selectedImage));
  const showSheetInspector = isMobile && sheetOpen && Boolean(selectedImage);

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

  const handleSelectedFileChange = useCallback((image: ImageItem | null) => {
    setSelectedImageId(image?.id ?? null);
    setSheetOpen(Boolean(image));
  }, []);

  const handleCloseInspector = useCallback(() => {
    setSheetOpen(false);
    setSelectedImageId(null);
  }, []);

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

  const inspector = (
    <AssetInspector
      image={selectedImage}
      images={images}
      onClose={handleCloseInspector}
      onDeleteImage={onDeleteImage}
      onUpdateImage={onUpdateImage}
      onCopyUrl={onCopyUrl}
      onCopyRemoteAccess={handleCopyRemoteAccess}
      onShareImage={onShareImage}
      getImageDimensionsFromUrl={getImageDimensionsFromUrl}
      t={t}
      variant={showSheetInspector ? 'sheet' : 'dock'}
    />
  );

  return (
    <div className="image-content-workbench">
      <div className="image-content-library">
        <AssetLibrary
          t={t}
          images={images}
          hasConfig={hasConfig}
          search={search}
          loading={loading}
          errorMessage={errorMessage}
          onDismissError={onClearError}
          onRetry={handleRetry}
          onUploadImage={uploadImage}
          onUploadMultipleImages={uploadMultipleImages}
          uploadLoading={uploadLoading}
          batchUploadProgress={batchUploadProgress}
          nativePickers={nativePickers}
          onOpenFolders={
            isMobile ? () => setWorkspaceExplorerOpen(true) : undefined
          }
          selectedFileId={selectedImageId}
          onSelectedFileChange={handleSelectedFileChange}
        />
      </div>
      {showDockedInspector ? inspector : null}
      {showSheetInspector ? inspector : null}
    </div>
  );
};
