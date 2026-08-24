import { EmptyState } from '@/ui';
import type { LibrarySearchConfig } from '@/ui';
import { getImageDimensionsFromUrl } from '@pixuli/core/utils';
import type { ImageEditData, ImageItem } from '@pixuli/core/types';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  /** 与 selectedIds 同步的实体，避免仅靠 id 反查失败导致 Inspector 空白 */
  const [selectedItems, setSelectedItems] = useState<ImageItem[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  const selectedImages = useMemo(
    () =>
      selectedIds
        .map(
          id =>
            selectedItems.find(item => item.id === id) ??
            images.find(item => item.id === id),
        )
        .filter((item): item is ImageItem => Boolean(item)),
    [images, selectedIds, selectedItems],
  );

  const selectedImage = selectedImages.length === 1 ? selectedImages[0] : null;

  // 宽屏常驻右栏（空态提示点选）；有选中时中/窄屏也打开 dock；手机用 sheet
  const showDockedInspector = !isMobile && (isWide || selectedIds.length > 0);
  const showSheetInspector = isMobile && selectedIds.length > 0;

  const errorMessage = useMemo(
    () => (error ? resolveImageErrorMessage(error, t) : null),
    [error, t],
  );

  const handleRetry = useCallback(() => {
    onClearError();
    void loadImages();
  }, [loadImages, onClearError]);

  const imagesRef = useRef(images);
  imagesRef.current = images;

  const handleSelectedIdsChange = useCallback(
    (ids: string[], items?: ImageItem[]) => {
      setSelectedIds(ids);
      if (items !== undefined) {
        setSelectedItems(items);
      } else if (ids.length === 0) {
        setSelectedItems([]);
      } else {
        setSelectedItems(
          ids
            .map(id => imagesRef.current.find(item => item.id === id))
            .filter((item): item is ImageItem => Boolean(item)),
        );
      }
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
    setSelectedItems([]);
  }, []);

  useEffect(() => {
    if (!workspaceExplorerOpen) return;
    window.dispatchEvent(new CustomEvent('pixuli:closeFilterPanel'));
  }, [workspaceExplorerOpen]);

  useEffect(() => {
    const onOpenFilter = () => {
      useUIStore.getState().setWorkspaceExplorerOpen(false);
    };
    const clearSelection = () => {
      setSheetOpen(false);
      setSelectedIds([]);
      setSelectedItems([]);
    };
    window.addEventListener('pixuli:openFilterPanel', onOpenFilter);
    window.addEventListener('pixuli:closeInspectorSheet', clearSelection);
    window.addEventListener('pixuli:clearLibrarySelection', clearSelection);
    return () => {
      window.removeEventListener('pixuli:openFilterPanel', onOpenFilter);
      window.removeEventListener('pixuli:closeInspectorSheet', clearSelection);
      window.removeEventListener(
        'pixuli:clearLibrarySelection',
        clearSelection,
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
      key={
        selectedImages.length >= 2
          ? `batch:${selectedImages.map(item => item.id).join(',')}`
          : (selectedImage?.id ?? 'empty')
      }
      image={selectedImage}
      selectedImages={selectedImages}
      images={images}
      onClose={handleCloseInspector}
      onDeleteImage={onDeleteImage}
      onDeleteMultipleImages={onDeleteMultipleImages}
      onUpdateImage={onUpdateImage}
      onCopyUrl={onCopyUrl}
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
