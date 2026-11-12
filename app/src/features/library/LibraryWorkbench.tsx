import type { BatchMetadataPatch } from '@/features/library/assetMutationService';
import { EmptyState } from '@/features/library/empty-state';
import type { LibrarySearchConfig } from '@/features/library/librarySearchTypes';
import { getImageDimensionsFromUrl } from '@pixuli/core/utils';
import type {
  AssetEditData,
  AssetItem,
  AssetUploadData,
  MultiAssetUploadData,
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
import { AssetLibraryConvertModal } from './AssetLibraryConvertModal';
import { convertLibraryAssets, cropLibraryAsset } from './convertLibraryAssets';
import type { ImageConvertRequest, ImageCropRect } from './imageConvertTarget';
import { downloadAssetsAsZip } from '@/features/library/assetDownloadService';
import { copyAssetPublicLinks } from '@/features/library/copyAssetLink';
import { requestWorkspaceSync } from '@/features/workspace/syncFeedback';
import { buildBatchSelectionActions } from '@/features/library/selectionActions';
import { libraryProcessModes } from '@/features/library/libraryProcess';
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
import { useAssetCopyUrl } from '@/features/library/useAssetCopyUrl';
import {
  useNativeAssetPickers,
  useNativeShareAsset,
} from '@/features/library/useNativeAssetActions';
import { useAssetStore } from '@/features/library/assetStore';
import { useUIStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/features/workspace/workspaceStore';
import { useSourceStore } from '@/features/settings/sourceStore';
import { isStoredSourcePrivate } from '@pixuli/core/sources';
import './LibraryWorkbench.css';

export interface LibraryWorkbenchProps {
  hasConfig: boolean;
  error: string | null;
  onClearError: () => void;
  assets: AssetItem[];
  loading: boolean;
  onDeleteAsset: (assetId: string, fileName: string) => Promise<void>;
  onDeleteMultipleAssets?: (
    assetIds: string[],
    fileNames: string[],
  ) => Promise<void>;
  onUpdateAsset: (data: AssetEditData) => Promise<void>;
  onBatchUpdateMetadata: (
    assetIds: string[],
    patch: BatchMetadataPatch,
  ) => Promise<{ updated: number; failed: number }>;
  t: (key: string, options?: Record<string, unknown>) => string;
  search?: LibrarySearchConfig;
}

function resolveAssetErrorMessage(
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
  assets,
  loading,
  onDeleteAsset,
  onDeleteMultipleAssets,
  onUpdateAsset,
  onBatchUpdateMetadata,
  t,
  search,
}) => {
  const uploadAsset = useAssetStore(state => state.uploadAsset);
  const uploadMultipleAssets = useAssetStore(
    state => state.uploadMultipleAssets,
  );
  const batchUploadProgress = useAssetStore(state => state.batchUploadProgress);
  const assetLoading = useAssetStore(state => state.loading);
  const loadAssets = useAssetStore(state => state.loadAssets);
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
  const uploadLoading = localActive ? workspaceLoading : assetLoading;
  const onCopyUrl = useAssetCopyUrl();
  const nativePickers = useNativeAssetPickers();
  const onShareAsset = useNativeShareAsset();
  const isMobile = useMobileViewport();
  const isWide = useWideViewport();
  const requestSync = useCallback(() => {
    requestWorkspaceSync();
  }, []);
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<AssetItem[]>([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [batchEditOpen, setBatchEditOpen] = useState(false);
  const [batchMoveOpen, setBatchMoveOpen] = useState(false);
  const [moveOverride, setMoveOverride] = useState<AssetItem[] | null>(null);
  const [previewRequest, setPreviewRequest] = useState<{
    id: string;
    nonce: number;
  } | null>(null);
  const [convertTargets, setConvertTargets] = useState<AssetItem[] | null>(
    null,
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const selectedAssets = useMemo(
    () =>
      selectedIds
        .map(
          id =>
            selectedItems.find(item => item.id === id) ??
            assets.find(item => item.id === id),
        )
        .filter((item): item is AssetItem => Boolean(item)),
    [assets, selectedIds, selectedItems],
  );

  const selectedAsset = selectedAssets.length === 1 ? selectedAssets[0] : null;
  const hasSelection = selectedIds.length > 0;
  const showDockedInspector =
    !isMobile && !inspectorCollapsed && (isWide || hasSelection);
  const showSheetInspector =
    isMobile && !multiSelectMode && selectedIds.length === 1 && sheetOpen;
  const showMobileSelectionBar =
    isMobile && hasSelection && (multiSelectMode || selectedIds.length >= 2);

  const errorMessage = useMemo(
    () => (error ? resolveAssetErrorMessage(error, t) : null),
    [error, t],
  );

  const handleRetry = useCallback(() => {
    onClearError();
    void loadAssets();
  }, [loadAssets, onClearError]);

  const assetsRef = useRef(assets);
  assetsRef.current = assets;

  const handleSelectedIdsChange = useCallback(
    (ids: string[], items?: AssetItem[]) => {
      setSelectedIds(ids);
      if (items !== undefined) {
        setSelectedItems(items);
      } else if (ids.length === 0) {
        setSelectedItems([]);
      } else {
        setSelectedItems(
          ids
            .map(id => assetsRef.current.find(item => item.id === id))
            .filter((item): item is AssetItem => Boolean(item)),
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

  const handleUploadAsset = useCallback(
    (data: AssetUploadData) => uploadAsset(data),
    [uploadAsset],
  );

  const handleUploadMultipleAssets = useCallback(
    (data: MultiAssetUploadData) => uploadMultipleAssets(data),
    [uploadMultipleAssets],
  );

  const handleSelectAsset = useCallback(
    (id: string) => {
      setMultiSelectMode(false);
      const item =
        assetsRef.current.find(asset => asset.id === id) ??
        selectedItems.find(asset => asset.id === id);
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
    if (selectedAssets.length === 0) return;
    if (
      !confirm(
        t('image.library.confirmDeleteN').replace(
          '{count}',
          String(selectedAssets.length),
        ),
      )
    ) {
      return;
    }
    if (selectedAssets.length === 1) {
      await onDeleteAsset(selectedAssets[0].id, selectedAssets[0].name);
    } else if (onDeleteMultipleAssets) {
      await onDeleteMultipleAssets(
        selectedAssets.map(item => item.id),
        selectedAssets.map(item => item.name),
      );
    }
    handleClearSelection();
  }, [
    handleClearSelection,
    onDeleteAsset,
    onDeleteMultipleAssets,
    selectedAssets,
    t,
  ]);

  const handleBatchDownload = useCallback(async () => {
    if (selectedAssets.length === 0) return;

    const loadingToast = showLoading(
      selectedAssets.length === 1
        ? t('image.library.batchDownloadSingle')
        : t('image.library.batchDownloadZipping').replace(
            '{count}',
            String(selectedAssets.length),
          ),
    );

    try {
      const result = await downloadAssetsAsZip(selectedAssets);
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
        selectedAssets.length === 1
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
  }, [selectedAssets, t]);

  const handleBatchEditSubmit = useCallback(
    async (patch: BatchMetadataPatch) => {
      const result = await onBatchUpdateMetadata(selectedIds, patch);
      await loadAssets();
      return result;
    },
    [loadAssets, onBatchUpdateMetadata, selectedIds],
  );

  const movingAssets = moveOverride ?? selectedAssets;

  const handleBatchMoveSubmit = useCallback(
    async (targetDir: string) => {
      const paths = (moveOverride ?? selectedAssets)
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
      setMoveOverride(null);
      handleClearSelection();
      await loadAssets();
    },
    [handleClearSelection, loadAssets, moveOverride, selectedAssets, t],
  );

  const handleSendConvert = useCallback(() => {
    if (!localActive) return;
    const assets = selectedAssets.filter(
      item => libraryProcessModes(getAssetKind(item)).length > 0,
    );
    if (assets.length === 0) return;
    setConvertTargets(assets);
  }, [localActive, selectedAssets]);

  const handleConvertSubmit = useCallback(
    async (request: ImageConvertRequest) => {
      const targets = convertTargets ?? [];
      if (targets.length === 0) return;
      const loadingToast = showLoading(t('image.library.convertSaving'));
      try {
        const result = await convertLibraryAssets(targets, request);
        await loadAssets();
        setConvertTargets(null);
        if (result.saved === 0) {
          updateLoadingToError(loadingToast, t('image.library.convertFailed'));
          return;
        }
        if (result.failed.length > 0) {
          updateLoadingToSuccess(
            loadingToast,
            t('image.library.convertPartial')
              .replace('{saved}', String(result.saved))
              .replace('{failed}', String(result.failed.length)),
          );
          return;
        }
        updateLoadingToSuccess(
          loadingToast,
          t('image.library.convertSuccess').replace(
            '{count}',
            String(result.saved),
          ),
        );
      } catch {
        updateLoadingToError(loadingToast, t('image.library.convertFailed'));
      }
    },
    [convertTargets, loadAssets, t],
  );

  const handleCropSubmit = useCallback(
    async (item: AssetItem, crop: ImageCropRect) => {
      const loadingToast = showLoading(t('image.library.cropSaving'));
      try {
        const result = await cropLibraryAsset(item, crop);
        await loadAssets();
        updateLoadingToSuccess(
          loadingToast,
          t('image.library.convertSuccess').replace(
            '{count}',
            String(result.saved),
          ),
        );
        return result;
      } catch {
        updateLoadingToError(loadingToast, t('image.library.cropFailed'));
        return { saved: 0 };
      }
    },
    [loadAssets, t],
  );

  const notifyCopyLinkResult = useCallback(
    (result: Awaited<ReturnType<typeof copyAssetPublicLinks>>) => {
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
      await copyAssetPublicLinks(selectedAssets, copyLinkOptions),
    );
  }, [copyLinkOptions, notifyCopyLinkResult, selectedAssets]);

  const handleCopyLinkForAsset = useCallback(
    async (asset: AssetItem) => {
      notifyCopyLinkResult(
        await copyAssetPublicLinks([asset], copyLinkOptions),
      );
    },
    [copyLinkOptions, notifyCopyLinkResult],
  );

  const batchSelectionActions = useMemo(
    () =>
      buildBatchSelectionActions(
        selectedAssets,
        t,
        {
          onBatchEdit:
            selectedAssets.length > 0
              ? () => setBatchEditOpen(true)
              : undefined,
          onBatchMove:
            localActive && selectedAssets.length > 0
              ? () => {
                  setMoveOverride(null);
                  setBatchMoveOpen(true);
                }
              : undefined,
          onBatchDownload: handleBatchDownload,
          onSync: () => requestSync(),
          onCopyLinks:
            selectedAssets.length > 0
              ? () => void handleCopyLinks()
              : undefined,
          onSendConvert: () => {
            handleSendConvert();
          },
          onBatchDelete: () => {
            void handleBatchDelete();
          },
        },
        { hasRemoteConnection, convertInLibrary: localActive },
      ),
    [
      handleBatchDelete,
      handleBatchDownload,
      handleCopyLinks,
      handleSendConvert,
      hasRemoteConnection,
      localActive,
      requestSync,
      selectedAssets,
      t,
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
        selectedAssets.length >= 2
          ? `batch:${selectedAssets.map(item => item.id).join(',')}`
          : (selectedAsset?.id ?? 'empty')
      }
      asset={selectedAsset}
      selectedAssets={selectedAssets}
      assets={assets}
      onClose={handleCloseInspector}
      onDeleteAsset={onDeleteAsset}
      onDeleteMultipleAssets={onDeleteMultipleAssets}
      onUpdateAsset={onUpdateAsset}
      onCopyUrl={onCopyUrl}
      onShareAsset={onShareAsset}
      onSync={() => requestSync()}
      onSendConvert={() => {
        handleSendConvert();
      }}
      onBatchEdit={
        selectedAssets.length > 0 ? () => setBatchEditOpen(true) : undefined
      }
      onBatchDownload={handleBatchDownload}
      onCopyLinks={handleCopyLinks}
      onCopyActiveLink={
        selectedAsset
          ? () => void handleCopyLinkForAsset(selectedAsset)
          : undefined
      }
      hasRemoteConnection={hasRemoteConnection}
      onSelectAsset={handleSelectAsset}
      enableFolderMove={localActive}
      folderOptions={localFolders}
      getImageDimensionsFromUrl={getImageDimensionsFromUrl}
      t={t}
      variant={showSheetInspector ? 'sheet' : 'dock'}
      openPreviewRequest={previewRequest}
      convertInLibrary={localActive}
    />
  );

  return (
    <div className="library-workbench">
      <div className="library-workbench__main">
        <AssetLibrary
          t={t}
          assets={assets}
          hasConfig={hasConfig}
          search={search}
          loading={loading}
          errorMessage={errorMessage}
          onDismissError={onClearError}
          onRetry={handleRetry}
          onUploadAsset={handleUploadAsset}
          onUploadMultipleAssets={handleUploadMultipleAssets}
          uploadLoading={uploadLoading}
          batchUploadProgress={batchUploadProgress}
          nativePickers={nativePickers}
          onOpenFolders={
            isWide ? undefined : () => setWorkspaceExplorerOpen(true)
          }
          selectedIds={selectedIds}
          onSelectedIdsChange={handleSelectedIdsChange}
          onDeleteAsset={onDeleteAsset}
          onCopyLink={asset => void handleCopyLinkForAsset(asset)}
          onMoveAsset={
            localActive
              ? asset => {
                  setMoveOverride([asset]);
                  setBatchMoveOpen(true);
                  handleSelectedIdsChange([asset.id], [asset]);
                }
              : undefined
          }
          onOpenFile={asset => {
            handleSelectedIdsChange([asset.id], [asset]);
            setPreviewRequest({ id: asset.id, nonce: Date.now() });
          }}
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
        selectedCount={movingAssets.length}
        folders={localFolders}
        t={t}
        onClose={() => {
          setBatchMoveOpen(false);
          setMoveOverride(null);
        }}
        onSubmit={handleBatchMoveSubmit}
      />
      <AssetLibraryConvertModal
        isOpen={convertTargets !== null}
        items={convertTargets ?? []}
        t={t}
        onClose={() => setConvertTargets(null)}
        onConvert={handleConvertSubmit}
        onCrop={handleCropSubmit}
      />
    </div>
  );
};
