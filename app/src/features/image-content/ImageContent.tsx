import { EmptyState } from '@/ui';
import type { LibrarySearchConfig } from '@/ui';
import { getImageDimensionsFromUrl } from '@pixuli/core/utils';
import type { ImageEditData, ImageItem } from '@pixuli/core/types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { ROUTES } from '@/router/routes';
import { useNavigate } from 'react-router-dom';
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
  onDeleteMultipleImages?: (
    imageIds: string[],
    fileNames: string[],
  ) => Promise<void>;
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
  onDeleteMultipleImages,
  onUpdateImage,
  onOpenConfigModal,
  t,
  search,
}) => {
  const navigate = useNavigate();
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
  const requestSync = useUIStore(state => state.requestSync);
  const workspaceExplorerOpen = useUIStore(
    state => state.workspaceExplorerOpen,
  );
  const setWorkspaceExplorerOpen = useUIStore(
    state => state.setWorkspaceExplorerOpen,
  );
  const setCurrentUtilityTool = useUIStore(
    state => state.setCurrentUtilityTool,
  );
  const setCurrentView = useUIStore(state => state.setCurrentView);
  const setActiveMenu = useUIStore(state => state.setActiveMenu);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  const selectedImages = useMemo(
    () =>
      selectedIds
        .map(id => images.find(item => item.id === id))
        .filter((item): item is ImageItem => Boolean(item)),
    [images, selectedIds],
  );

  const selectedImage = selectedImages.length === 1 ? selectedImages[0] : null;

  const showDockedInspector =
    isWide ||
    (!isMobile && selectedImages.length > 0 && !workspaceExplorerOpen);
  const showSheetInspector =
    isMobile && sheetOpen && selectedImages.length === 1;

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

  const handleSelectedIdsChange = useCallback(
    (ids: string[]) => {
      setSelectedIds(ids);
      setSheetOpen(ids.length > 0);
      if (ids.length > 0 && !isWide) {
        window.dispatchEvent(new CustomEvent('pixuli:closeFilterPanel'));
        useUIStore.getState().setWorkspaceExplorerOpen(false);
      }
    },
    [isWide],
  );

  const handleCloseInspector = useCallback(() => {
    setSheetOpen(false);
    setSelectedIds([]);
  }, []);

  useEffect(() => {
    if (!workspaceExplorerOpen) return;
    setSheetOpen(false);
    window.dispatchEvent(new CustomEvent('pixuli:closeFilterPanel'));
  }, [workspaceExplorerOpen]);

  useEffect(() => {
    const onOpenFilter = () => {
      setSheetOpen(false);
      useUIStore.getState().setWorkspaceExplorerOpen(false);
    };
    const onCloseInspector = () => {
      setSheetOpen(false);
    };
    const onClearSelection = () => {
      setSheetOpen(false);
      setSelectedIds([]);
    };
    window.addEventListener('pixuli:openFilterPanel', onOpenFilter);
    window.addEventListener('pixuli:closeInspectorSheet', onCloseInspector);
    window.addEventListener('pixuli:clearLibrarySelection', onClearSelection);
    return () => {
      window.removeEventListener('pixuli:openFilterPanel', onOpenFilter);
      window.removeEventListener(
        'pixuli:closeInspectorSheet',
        onCloseInspector,
      );
      window.removeEventListener(
        'pixuli:clearLibrarySelection',
        onClearSelection,
      );
    };
  }, []);

  const handleSendCompress = useCallback(() => {
    setCurrentUtilityTool('compress');
    setCurrentView('photos');
    setActiveMenu('compress');
    navigate(ROUTES.COMPRESS);
  }, [navigate, setActiveMenu, setCurrentUtilityTool, setCurrentView]);

  const handleSendConvert = useCallback(() => {
    setCurrentUtilityTool('convert');
    setCurrentView('photos');
    setActiveMenu('convert');
    navigate(ROUTES.CONVERT);
  }, [navigate, setActiveMenu, setCurrentUtilityTool, setCurrentView]);

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
      selectedImages={selectedImages}
      images={images}
      onClose={handleCloseInspector}
      onDeleteImage={onDeleteImage}
      onDeleteMultipleImages={onDeleteMultipleImages}
      onUpdateImage={onUpdateImage}
      onCopyUrl={onCopyUrl}
      onCopyRemoteAccess={handleCopyRemoteAccess}
      onShareImage={onShareImage}
      onSync={() => requestSync()}
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
            isWide ? undefined : () => setWorkspaceExplorerOpen(true)
          }
          selectedIds={selectedIds}
          onSelectedIdsChange={handleSelectedIdsChange}
          onDeleteImage={onDeleteImage}
          onDeleteMultipleImages={onDeleteMultipleImages}
          onSync={() => requestSync()}
          onOpenAccess={openAccessModal}
          onSendCompress={handleSendCompress}
          onSendConvert={handleSendConvert}
        />
      </div>
      {showDockedInspector ? inspector : null}
      {showSheetInspector ? inspector : null}
    </div>
  );
};
