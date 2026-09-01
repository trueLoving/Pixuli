import type { BatchMetadataPatch } from '@/features/library/assetMutationService';
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
import { AssetLibraryBatchEditModal } from './AssetLibraryBatchEditModal';
import { downloadAssetsAsZip } from '@/features/library/assetDownloadService';
import { copyImagePublicLinks } from '@/features/library/copyImageLink';
import { buildBatchSelectionActions } from '@/features/library/selectionActions';
import {
  showError,
  showLoading,
  showSuccess,
  updateLoadingToError,
  updateLoadingToSuccess,
} from '@/ui/feedback/toast';
import { useMobileViewport, useWideViewport } from '@/hooks/useMobileViewport';
import { isWorkspaceAvailable } from '@/platforms/workspacePlatform';
import { useImageCopyUrl } from '@/features/library/useImageCopyUrl';
import {
  useNativeImagePickers,
  useNativeShareImage,
} from '@/features/library/useNativeImageActions';
import { useImageStore } from '@/features/library/imageStore';
import { openUtilityTool } from '@/features/tools/utilityToolPort';
import { useUIStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/features/workspace/workspaceStore';
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
  onBatchUpdateMetadata: (
    imageIds: string[],
    patch: BatchMetadataPatch,
  ) => Promise<{ updated: number; failed: number }>;
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
  onBatchUpdateMetadata,
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
  const requestSync = useUIStore(state => state.requestSync);
  const workspaceExplorerOpen = useUIStore(
    state => state.workspaceExplorerOpen,
  );
  const setWorkspaceExplorerOpen = useUIStore(
    state => state.setWorkspaceExplorerOpen,
  );
  const currentUtilityTool = useUIStore(state => state.currentUtilityTool);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<ImageItem[]>([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [batchEditOpen, setBatchEditOpen] = useState(false);
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
  const hasSelection = selectedIds.length > 0;
  const showDockedInspector = !isMobile && (isWide || hasSelection);
  const showSheetInspector =
    isMobile && !multiSelectMode && selectedIds.length === 1 && sheetOpen;
  const showMobileSelectionBar =
    isMobile && hasSelection && (multiSelectMode || selectedIds.length >= 2);

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
      setSheetOpen(isMobile && ids.length === 1 && !multiSelectMode);
      if (
        ids.length > 0 &&
        isMobile &&
        !isWide &&
        !multiSelectMode &&
        ids.length === 1
      ) {
        window.dispatchEvent(new CustomEvent('pixuli:closeFilterPanel'));
        useUIStore.getState().setWorkspaceExplorerOpen(false);
      }
    },
    [isMobile, isWide, multiSelectMode],
  );

  const handleMultiSelectModeChange = useCallback((active: boolean) => {
    setMultiSelectMode(active);
    if (active) {
      setSheetOpen(false);
    }
  }, []);

  const handleUploadImage = useCallback(
    async (data: ImageUploadData) => {
      await uploadImage(data);
    },
    [uploadImage],
  );

  const handleUploadMultipleImages = useCallback(
    async (data: MultiImageUploadData) => {
      await uploadMultipleImages(data);
    },
    [uploadMultipleImages],
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
      setMultiSelectMode(false);
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

  const handleClearSelection = useCallback(() => {
    setSheetOpen(false);
    setSelectedIds([]);
    setSelectedItems([]);
    setReviewIds([]);
    setReviewIndex(0);
    setMultiSelectMode(false);
  }, []);

  const handleBatchDelete = useCallback(async () => {
    if (selectedImages.length === 0) return;
    if (
      !confirm(
        t('image.library.confirmDeleteN').replace(
          '{count}',
          String(selectedImages.length),
        ),
      )
    ) {
      return;
    }
    if (selectedImages.length === 1) {
      await onDeleteImage(selectedImages[0].id, selectedImages[0].name);
    } else if (onDeleteMultipleImages) {
      await onDeleteMultipleImages(
        selectedImages.map(item => item.id),
        selectedImages.map(item => item.name),
      );
    }
    handleClearSelection();
  }, [
    handleClearSelection,
    onDeleteImage,
    onDeleteMultipleImages,
    selectedImages,
    t,
  ]);

  const handleBatchDownload = useCallback(async () => {
    if (selectedImages.length === 0) return;

    const loadingToast = showLoading(
      selectedImages.length === 1
        ? t('image.library.batchDownloadSingle')
        : t('image.library.batchDownloadZipping').replace(
            '{count}',
            String(selectedImages.length),
          ),
    );

    try {
      const result = await downloadAssetsAsZip(selectedImages);
      if (result.failed > 0) {
        updateLoadingToError(
          loadingToast,
          t('image.library.batchDownloadPartial').replace(
            '{failed}',
            String(result.failed),
          ),
        );
        return;
      }

      updateLoadingToSuccess(
        loadingToast,
        selectedImages.length === 1
          ? t('image.library.batchDownloadSuccessSingle')
          : t('image.library.batchDownloadSuccessZip').replace(
              '{count}',
              String(result.packed),
            ),
      );
    } catch {
      updateLoadingToError(
        loadingToast,
        t('image.library.batchDownloadFailed'),
      );
    }
  }, [selectedImages, t]);

  const handleBatchEditSubmit = useCallback(
    async (patch: BatchMetadataPatch) => {
      const result = await onBatchUpdateMetadata(selectedIds, patch);
      await loadImages();
      return result;
    },
    [loadImages, onBatchUpdateMetadata, selectedIds],
  );

  const handleSendCompress = useCallback(() => {
    openUtilityTool('compress');
  }, []);

  const handleSendConvert = useCallback(() => {
    openUtilityTool('convert');
  }, []);

  const notifyCopyLinkResult = useCallback(
    (result: Awaited<ReturnType<typeof copyImagePublicLinks>>) => {
      if (!result.ok) {
        showError(t(result.reasonKey));
        return;
      }
      showSuccess(
        result.count === 1
          ? `${t('image.grid.imageUrlCopied')}${t('image.grid.copiedToClipboard')}`
          : t('image.copyLink.copiedMany').replace(
              '{count}',
              String(result.count),
            ),
      );
    },
    [t],
  );

  const handleCopyLinks = useCallback(async () => {
    notifyCopyLinkResult(await copyImagePublicLinks(selectedImages));
  }, [notifyCopyLinkResult, selectedImages]);

  const handleCopyLinkForImage = useCallback(
    async (image: ImageItem) => {
      notifyCopyLinkResult(await copyImagePublicLinks([image]));
    },
    [notifyCopyLinkResult],
  );

  const batchSelectionActions = useMemo(
    () =>
      buildBatchSelectionActions(selectedImages, t, {
        onBatchEdit:
          selectedImages.length > 0 ? () => setBatchEditOpen(true) : undefined,
        onBatchDownload: handleBatchDownload,
        onSync: () => requestSync(),
        onCopyLinks:
          selectedImages.length > 0 ? () => void handleCopyLinks() : undefined,
        onSendCompress: handleSendCompress,
        onSendConvert: handleSendConvert,
        onBatchDelete: () => {
          void handleBatchDelete();
        },
      }),
    [
      handleBatchDelete,
      handleBatchDownload,
      handleCopyLinks,
      handleSendCompress,
      handleSendConvert,
      requestSync,
      selectedImages,
      t,
    ],
  );

  const handleCloseInspector = useCallback(() => {
    handleClearSelection();
  }, [handleClearSelection]);

  useEffect(() => {
    if (!workspaceExplorerOpen) return;
    window.dispatchEvent(new CustomEvent('pixuli:closeFilterPanel'));
  }, [workspaceExplorerOpen]);

  useEffect(() => {
    const onOpenFilter = () => {
      useUIStore.getState().setWorkspaceExplorerOpen(false);
    };
    const clearSelection = () => {
      handleClearSelection();
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
  }, [handleClearSelection]);

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
      onBatchEdit={
        selectedImages.length > 0 ? () => setBatchEditOpen(true) : undefined
      }
      onBatchDownload={handleBatchDownload}
      onCopyLinks={handleCopyLinks}
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
          onCopyLink={image => void handleCopyLinkForImage(image)}
          onSync={() => requestSync()}
          multiSelectMode={multiSelectMode}
          onMultiSelectModeChange={handleMultiSelectModeChange}
          showSelectionActionBar={showMobileSelectionBar}
          selectionActions={batchSelectionActions}
          onClearSelection={handleClearSelection}
        />
      </div>
      {showDockedInspector ? inspector : null}
      {showSheetInspector ? inspector : null}
      <AssetLibraryBatchEditModal
        isOpen={batchEditOpen}
        selectedCount={selectedIds.length}
        loading={loading}
        t={t}
        onClose={() => setBatchEditOpen(false)}
        onSubmit={handleBatchEditSubmit}
      />
      <UtilityToolOverlay />
    </div>
  );
};
