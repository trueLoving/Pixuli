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
import { AssetLibraryBatchMoveModal } from './AssetLibraryBatchMoveModal';
import {
  downloadAssetsAsZip,
  loadAssetsAsFiles,
} from '@/features/library/assetDownloadService';
import { copyImagePublicLinks } from '@/features/library/copyImageLink';
import { buildBatchSelectionActions } from '@/features/library/selectionActions';
import { getAssetKind } from '@/features/library/utils/assetKind';
import { shouldResetOnFolderChange } from '@/features/library/utils/folderScopeReset';
import {
  showError,
  showErrorWithAction,
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
import { setUtilityToolSeedFiles } from '@/features/tools/utilityToolSeed';
import { useUtilityToolsStore } from '@/features/tools/utilityToolsConfig';
import { useUIStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/features/workspace/workspaceStore';
import { useSourceStore } from '@/features/settings/sourceStore';
import { isStoredSourcePrivate } from '@pixuli/core/sources';
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
  const localFolders = useWorkspaceStore(state => state.localFolders);
  const sources = useSourceStore(state => state.sources);
  const selectedSourceId = useSourceStore(state => state.selectedSourceId);
  const getSourceById = useSourceStore(state => state.getSourceById);
  const hasRemoteConnection = sources.length > 0;
  const repoPrivate = useMemo(() => {
    const source = selectedSourceId
      ? getSourceById(selectedSourceId)
      : sources[0];
    return source ? isStoredSourcePrivate(source) : false;
  }, [getSourceById, selectedSourceId, sources]);
  const uploadLoading = localActive ? workspaceLoading : imageLoading;
  const onCopyUrl = useImageCopyUrl();
  const nativePickers = useNativeImagePickers();
  const onShareImage = useNativeShareImage();
  const isMobile = useMobileViewport();
  const isWide = useWideViewport();
  const requestSync = useUIStore(state => state.requestSync);
  const inspectorCollapsed = useUIStore(state => state.inspectorCollapsed);
  const setInspectorCollapsed = useUIStore(
    state => state.setInspectorCollapsed,
  );
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
  const [batchMoveOpen, setBatchMoveOpen] = useState(false);
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
  const hasSelection = selectedIds.length > 0;
  const showDockedInspector =
    !isMobile && !inspectorCollapsed && (isWide || hasSelection);
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
      if (ids.length > 0) {
        setInspectorCollapsed(false);
      }
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
    [isMobile, isWide, multiSelectMode, setInspectorCollapsed],
  );

  const handleMultiSelectModeChange = useCallback((active: boolean) => {
    setMultiSelectMode(active);
    if (active) {
      setSheetOpen(false);
    }
  }, []);

  const handleUploadImage = useCallback(
    (data: ImageUploadData) => uploadImage(data),
    [uploadImage],
  );

  const handleUploadMultipleImages = useCallback(
    (data: MultiImageUploadData) => uploadMultipleImages(data),
    [uploadMultipleImages],
  );

  const handleSelectImage = useCallback(
    (id: string) => {
      setMultiSelectMode(false);
      const item =
        imagesRef.current.find(image => image.id === id) ??
        selectedItems.find(image => image.id === id);
      handleSelectedIdsChange([id], item ? [item] : undefined);
    },
    [handleSelectedIdsChange, selectedItems],
  );

  const handleClearSelection = useCallback(() => {
    setSheetOpen(false);
    setSelectedIds([]);
    setSelectedItems([]);
    setMultiSelectMode(false);
  }, []);

  const selectedFolderPath = useUIStore(state => state.selectedFolderPath);
  const folderPathForSelectionRef = useRef<string | null>(null);
  useEffect(() => {
    const previous = folderPathForSelectionRef.current;
    if (shouldResetOnFolderChange(previous, selectedFolderPath)) {
      handleClearSelection();
    }
    folderPathForSelectionRef.current = selectedFolderPath;
  }, [handleClearSelection, selectedFolderPath]);

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

  const handleBatchMoveSubmit = useCallback(
    async (targetDir: string) => {
      const paths = selectedImages
        .map(item => item.localPath)
        .filter((path): path is string => Boolean(path));
      if (paths.length === 0) {
        showError(t('image.library.batchMoveFailed'));
        return;
      }
      const moved = await useWorkspaceStore
        .getState()
        .moveLocalFiles(paths, targetDir);
      if (useWorkspaceStore.getState().error) {
        showError(t('image.library.batchMoveFailed'));
        return;
      }
      showSuccess(
        moved === 0
          ? t('image.library.batchMoveNone')
          : t('image.library.batchMoveSuccess').replace(
              '{count}',
              String(moved),
            ),
      );
      setBatchMoveOpen(false);
      handleClearSelection();
      await loadImages();
    },
    [handleClearSelection, loadImages, selectedImages, t],
  );

  const toolsEnabled = useUtilityToolsStore(state => state.enabled);

  const handleSendCompress = useCallback(async () => {
    if (!toolsEnabled) return;
    const images = selectedImages.filter(
      item => getAssetKind(item) === 'image',
    );
    const files = await loadAssetsAsFiles(images);
    setUtilityToolSeedFiles(files);
    openUtilityTool('compress');
  }, [selectedImages, toolsEnabled]);

  const handleSendConvert = useCallback(async () => {
    if (!toolsEnabled) return;
    const images = selectedImages.filter(
      item => getAssetKind(item) === 'image',
    );
    const files = await loadAssetsAsFiles(images);
    setUtilityToolSeedFiles(files);
    openUtilityTool('convert');
  }, [selectedImages, toolsEnabled]);

  const notifyCopyLinkResult = useCallback(
    (result: Awaited<ReturnType<typeof copyImagePublicLinks>>) => {
      if (!result.ok) {
        if (result.offerConnection) {
          showErrorWithAction(
            t(result.reasonKey),
            t('image.copyLink.goConnection'),
            () => useUIStore.getState().openSettingsModalForAddSource(),
          );
          return;
        }
        if (result.offerSync) {
          showErrorWithAction(
            t(result.reasonKey),
            t('image.copyLink.goSync'),
            () => requestSync(),
          );
          return;
        }
        showError(t(result.reasonKey));
        return;
      }
      const base =
        result.count === 1
          ? `${t('image.grid.imageUrlCopied')}${t('image.grid.copiedToClipboard')}`
          : t('image.copyLink.copiedMany').replace(
              '{count}',
              String(result.count),
            );
      showSuccess(
        result.privateRepo
          ? `${base} ${t('image.copyLink.privateRepoNote')}`
          : base,
      );
    },
    [requestSync, t],
  );

  const copyLinkOptions = useMemo(
    () => ({ hasRemoteConnection, repoPrivate }),
    [hasRemoteConnection, repoPrivate],
  );

  const handleCopyLinks = useCallback(async () => {
    notifyCopyLinkResult(
      await copyImagePublicLinks(selectedImages, copyLinkOptions),
    );
  }, [copyLinkOptions, notifyCopyLinkResult, selectedImages]);

  const handleCopyLinkForImage = useCallback(
    async (image: ImageItem) => {
      notifyCopyLinkResult(
        await copyImagePublicLinks([image], copyLinkOptions),
      );
    },
    [copyLinkOptions, notifyCopyLinkResult],
  );

  const batchSelectionActions = useMemo(
    () =>
      buildBatchSelectionActions(
        selectedImages,
        t,
        {
          onBatchEdit:
            selectedImages.length > 0
              ? () => setBatchEditOpen(true)
              : undefined,
          onBatchMove:
            localActive && selectedImages.length > 0
              ? () => setBatchMoveOpen(true)
              : undefined,
          onBatchDownload: handleBatchDownload,
          onSync: () => requestSync(),
          onCopyLinks:
            selectedImages.length > 0
              ? () => void handleCopyLinks()
              : undefined,
          onSendCompress: () => {
            void handleSendCompress();
          },
          onSendConvert: () => {
            void handleSendConvert();
          },
          onBatchDelete: () => {
            void handleBatchDelete();
          },
        },
        { hasRemoteConnection, toolsEnabled },
      ),
    [
      handleBatchDelete,
      handleBatchDownload,
      handleCopyLinks,
      handleSendCompress,
      handleSendConvert,
      hasRemoteConnection,
      localActive,
      requestSync,
      selectedImages,
      t,
      toolsEnabled,
    ],
  );

  const handleCloseInspector = useCallback(() => {
    handleClearSelection();
    setInspectorCollapsed(true);
  }, [handleClearSelection, setInspectorCollapsed]);

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
            useUIStore.getState().openSettingsModalForAddSource('github');
          }}
          onAddGitee={() => {
            useUIStore.getState().openSettingsModalForAddSource('gitee');
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
      onSendCompress={() => {
        void handleSendCompress();
      }}
      onSendConvert={() => {
        void handleSendConvert();
      }}
      onBatchEdit={
        selectedImages.length > 0 ? () => setBatchEditOpen(true) : undefined
      }
      onBatchDownload={handleBatchDownload}
      onCopyLinks={handleCopyLinks}
      onCopyActiveLink={
        selectedImage
          ? () => void handleCopyLinkForImage(selectedImage)
          : undefined
      }
      hasRemoteConnection={hasRemoteConnection}
      onSelectImage={handleSelectImage}
      enableFolderMove={localActive}
      folderOptions={localFolders}
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
          hasRemoteConnection={hasRemoteConnection}
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
      <AssetLibraryBatchMoveModal
        isOpen={batchMoveOpen}
        selectedCount={selectedIds.length}
        folders={localFolders}
        t={t}
        onClose={() => setBatchMoveOpen(false)}
        onSubmit={handleBatchMoveSubmit}
      />
      <UtilityToolOverlay />
    </div>
  );
};
