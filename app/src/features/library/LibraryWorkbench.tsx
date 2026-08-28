import { EmptyState } from '@/features/library/empty-state';
import type { LibrarySearchConfig } from '@/features/library/librarySearchTypes';
import { UtilityToolOverlay } from '@/features/tools/UtilityToolOverlay';
import { getImageDimensionsFromUrl } from '@pixuli/core/utils';
import type {
  ImageEditData,
  ImageItem,
  ImageUploadData,
  MultiImageUploadData,
} from '@pixuli/core/types';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AssetInspector } from '../inspector/AssetInspector';
import { AssetLibrary } from './AssetLibrary';
import { useMobileViewport, useWideViewport } from '@/hooks/useMobileViewport';
import { isWorkspaceAvailable } from '@/platforms/workspacePlatform';
import { useImageCopyUrl } from '@/features/library/useImageCopyUrl';
import {
  useNativeImagePickers,
  useNativeShareImage,
} from '@/features/library/useNativeImageActions';
import { useImageStore } from '@/stores/imageStore';
import { useUIStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import './LibraryWorkbench.css';

export interface LibraryWorkbenchProps {
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
  t: (key: string, options?: Record<string, unknown>) => string;
  search?: LibrarySearchConfig;
}

function resolveImageErrorMessage(
  error: string,
  t: (key: string, options?: Record<string, unknown>) => string,
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

export const LibraryWorkbench: React.FC<LibraryWorkbenchProps> = ({
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
  const currentUtilityTool = useUIStore(state => state.currentUtilityTool);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<ImageItem[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reviewIds, setReviewIds] = useState<string[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [editNonce, setEditNonce] = useState(0);

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

  const beginMetadataReview = useCallback(
    (items: ImageItem[]) => {
      const ids = items.map(item => item.id).filter(Boolean);
      if (ids.length === 0) {
        return;
      }
      setReviewIds(ids);
      setReviewIndex(0);
      handleSelectedIdsChange([ids[0]], [items[0]]);
      setEditNonce(nonce => nonce + 1);
    },
    [handleSelectedIdsChange],
  );

  const handleUploadImage = useCallback(
    async (data: ImageUploadData) => {
      const created = await uploadImage(data);
      if (created) {
        beginMetadataReview([created]);
      }
    },
    [beginMetadataReview, uploadImage],
  );

  const handleUploadMultipleImages = useCallback(
    async (data: MultiImageUploadData) => {
      const created = await uploadMultipleImages(data);
      if (created.length > 0) {
        beginMetadataReview(created);
      }
    },
    [beginMetadataReview, uploadMultipleImages],
  );

  const handleReviewPrev = useCallback(() => {
    setReviewIndex(index => {
      const next = Math.max(0, index - 1);
      const id = reviewIds[next];
      if (id) {
        handleSelectedIdsChange([id]);
        setEditNonce(nonce => nonce + 1);
      }
      return next;
    });
  }, [handleSelectedIdsChange, reviewIds]);

  const handleReviewNext = useCallback(() => {
    setReviewIndex(index => {
      const next = Math.min(reviewIds.length - 1, index + 1);
      const id = reviewIds[next];
      if (id) {
        handleSelectedIdsChange([id]);
        setEditNonce(nonce => nonce + 1);
      }
      return next;
    });
  }, [handleSelectedIdsChange, reviewIds]);

  const handleReviewDone = useCallback(() => {
    setReviewIds([]);
    setReviewIndex(0);
  }, []);

  const handleSelectImage = useCallback(
    (id: string) => {
      const item =
        imagesRef.current.find(image => image.id === id) ??
        selectedItems.find(image => image.id === id);
      handleSelectedIdsChange([id], item ? [item] : undefined);
      const reviewPos = reviewIds.indexOf(id);
      if (reviewPos >= 0) {
        setReviewIndex(reviewPos);
        setEditNonce(nonce => nonce + 1);
      }
    },
    [handleSelectedIdsChange, reviewIds, selectedItems],
  );

  const handleCloseInspector = useCallback(() => {
    setSheetOpen(false);
    setSelectedIds([]);
    setSelectedItems([]);
    setReviewIds([]);
    setReviewIndex(0);
  }, []);

  const openUtilityTool = useCallback(
    (tool: 'compress' | 'convert') => {
      setCurrentUtilityTool(tool);
      setCurrentView('library');
      setActiveMenu(tool);
    },
    [setActiveMenu, setCurrentUtilityTool, setCurrentView],
  );

  const handleSendCompress = useCallback(() => {
    openUtilityTool('compress');
  }, [openUtilityTool]);

  const handleSendConvert = useCallback(() => {
    openUtilityTool('convert');
  }, [openUtilityTool]);

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
      setReviewIds([]);
      setReviewIndex(0);
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

  const metadataReview =
    reviewIds.length > 0
      ? {
          ids: reviewIds,
          index: reviewIndex,
          onPrev: handleReviewPrev,
          onNext: handleReviewNext,
          onDone: handleReviewDone,
          openEditNonce: editNonce,
        }
      : null;

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
      onSendCompress={handleSendCompress}
      onSendConvert={handleSendConvert}
      onSelectImage={handleSelectImage}
      metadataReview={metadataReview}
      getImageDimensionsFromUrl={getImageDimensionsFromUrl}
      t={t}
      variant={showSheetInspector ? 'sheet' : 'dock'}
    />
  );

  return (
    <div className="library-workbench">
      <div
        className="library-workbench__main"
        aria-hidden={currentUtilityTool ? true : undefined}
      >
        <AssetLibrary
          t={t}
          images={images}
          hasConfig={hasConfig}
          search={search}
          loading={loading}
          errorMessage={errorMessage}
          onDismissError={onClearError}
          onRetry={handleRetry}
          onUploadImage={handleUploadImage}
          onUploadMultipleImages={handleUploadMultipleImages}
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
      <UtilityToolOverlay />
    </div>
  );
};

/** @deprecated 使用 LibraryWorkbench */
export const ImageContent = LibraryWorkbench;
