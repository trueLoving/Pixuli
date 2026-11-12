import {
  LogActionType,
  LogStatus,
  useLogStore,
} from '@/features/operation-log';
import { getWorkspaceLibraryPort } from '@/features/library/workspaceAssetBridge';
import {
  isLocalListMode,
  refreshLocalAssetList,
  unconfiguredStorageError,
} from '@/features/library/assetListService';
import type { StoragePluginId } from '@/storage/createProvider';
import type {
  BatchUploadProgress,
  AssetItem,
  AssetUploadData,
  MultiAssetUploadData,
  UploadProgress,
} from '@pixuli/core/types';
import { getUploadFileName } from '@pixuli/core/types';
import type { StorageProvider } from '@pixuli/core/plugins';

export type AssetUploadContext = {
  assets: AssetItem[];
  storageProvider: StorageProvider | null;
  storageType: StoragePluginId | null;
};

export type AssetUploadSet = (
  partial:
    | Partial<{
        assets: AssetItem[];
        loading: boolean;
        error: string | null;
        batchUploadProgress: BatchUploadProgress | null;
      }>
    | ((state: {
        assets: AssetItem[];
        batchUploadProgress: BatchUploadProgress | null;
      }) => Partial<{
        assets: AssetItem[];
        loading: boolean;
        error: string | null;
        batchUploadProgress: BatchUploadProgress | null;
      }>),
) => void;

function updateBatchItem(
  set: AssetUploadSet,
  itemId: string,
  patch: Partial<UploadProgress> & { completed?: number; failed?: number },
): void {
  set(state => {
    if (!state.batchUploadProgress) {
      return {};
    }
    const { completed, failed, ...itemPatch } = patch;
    return {
      batchUploadProgress: {
        ...state.batchUploadProgress,
        ...(completed !== undefined ? { completed } : {}),
        ...(failed !== undefined ? { failed } : {}),
        items: state.batchUploadProgress.items.map(item =>
          item.id === itemId ? { ...item, ...itemPatch } : item,
        ),
      },
    };
  });
}

export async function uploadAsset(
  uploadData: AssetUploadData,
  get: () => AssetUploadContext,
  set: AssetUploadSet,
): Promise<AssetItem | null> {
  const ctx = get();
  if (isLocalListMode()) {
    const imported =
      await getWorkspaceLibraryPort().importLocalAsset(uploadData);
    await refreshLocalAssetList(set, { quiet: true });
    if (!imported) {
      return null;
    }
    return get().assets.find(asset => asset.id === imported.id) ?? imported;
  }

  const { storageProvider, storageType } = ctx;
  if (!storageProvider) {
    set({
      error: unconfiguredStorageError(storageType),
      loading: false,
    });
    return null;
  }

  set({ loading: true, error: null });
  const startTime = Date.now();
  try {
    const newAsset = await storageProvider.uploadImage(uploadData);
    const duration = Date.now() - startTime;
    set({
      assets: get().assets.some(img => img.id === newAsset.id)
        ? get().assets.map(img => (img.id === newAsset.id ? newAsset : img))
        : [...get().assets, newAsset],
      loading: false,
    });
    useLogStore.getState().addLog(LogActionType.UPLOAD, LogStatus.SUCCESS, {
      assetId: newAsset.id,
      assetName: newAsset.name,
      duration,
      details: {
        size: newAsset.size,
        type: newAsset.type,
        capture: newAsset.captureMetadata,
      },
    });
    return newAsset;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : '上传图片失败';
    set({ error: errorMsg, loading: false });
    useLogStore.getState().addLog(LogActionType.UPLOAD, LogStatus.FAILED, {
      assetName: getUploadFileName(uploadData.file, uploadData.name),
      error: errorMsg,
      duration,
    });
    return null;
  } finally {
    set({ loading: false });
  }
}

export async function uploadMultipleAssets(
  uploadData: MultiAssetUploadData,
  get: () => AssetUploadContext,
  set: AssetUploadSet,
): Promise<AssetItem[]> {
  const ctx = get();
  const { files, name, description, tags, captureMetadataList } = uploadData;

  if (isLocalListMode()) {
    const total = files.length;
    if (total === 0) {
      return [];
    }

    let completed = 0;
    let failed = 0;
    const startTime = Date.now();
    const imported: AssetItem[] = [];
    const items: UploadProgress[] = files.map((_file, index) => ({
      id: `${Date.now()}-${index}`,
      progress: 0,
      status: 'uploading' as const,
      message: '等待导入...',
    }));

    set({
      error: null,
      batchUploadProgress: {
        total,
        completed: 0,
        failed: 0,
        current: files[0]?.name,
        items,
      },
    });

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const itemId = items[i].id;
        set(state => ({
          batchUploadProgress: state.batchUploadProgress
            ? {
                ...state.batchUploadProgress,
                current: file.name,
              }
            : null,
        }));
        updateBatchItem(set, itemId, {
          status: 'uploading',
          message: '正在导入...',
        });

        try {
          const created = await getWorkspaceLibraryPort().importLocalAsset({
            file,
            name: file.name,
            description,
            tags,
            targetFolder: uploadData.targetFolder,
            captureMetadata: captureMetadataList?.[i],
          });
          if (created) {
            imported.push(created);
          }
          completed++;
          updateBatchItem(set, itemId, {
            completed,
            status: 'success',
            progress: 100,
            message: '导入成功',
          });
        } catch (error) {
          failed++;
          updateBatchItem(set, itemId, {
            failed,
            status: 'error',
            message: error instanceof Error ? error.message : '导入失败',
          });
        }
      }

      await refreshLocalAssetList(set, { quiet: true });
      set({ batchUploadProgress: null });
      useLogStore
        .getState()
        .addLog(LogActionType.BATCH_UPLOAD, LogStatus.SUCCESS, {
          details: { total, completed, failed },
          duration: Date.now() - startTime,
        });
      const importedIds = new Set(imported.map(item => item.id));
      return get().assets.filter(asset => importedIds.has(asset.id));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '批量导入失败';
      set({ error: errorMsg, batchUploadProgress: null });
      useLogStore
        .getState()
        .addLog(LogActionType.BATCH_UPLOAD, LogStatus.FAILED, {
          error: errorMsg,
          details: { total, completed, failed },
        });
      return [];
    }
  }

  const { storageProvider, storageType } = ctx;
  if (!storageProvider) {
    set({
      error: unconfiguredStorageError(storageType),
      loading: false,
    });
    return [];
  }

  const total = files.length;
  let completed = 0;
  let failed = 0;
  const uploadedAssets: AssetItem[] = [];

  try {
    const items: UploadProgress[] = files.map((_file, index) => ({
      id: `${Date.now()}-${index}`,
      progress: 0,
      status: 'uploading' as const,
      message: '等待上传...',
    }));

    set({
      loading: true,
      error: null,
      batchUploadProgress: {
        total,
        completed: 0,
        failed: 0,
        current: files[0]?.name,
        items,
      },
    });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const itemId = items[i].id;

      try {
        set(state => ({
          batchUploadProgress: state.batchUploadProgress
            ? { ...state.batchUploadProgress, current: file.name }
            : null,
        }));
        updateBatchItem(set, itemId, {
          status: 'uploading',
          message: '正在上传...',
        });

        const fileName = name ? `${name}-${i + 1}-${file.name}` : file.name;
        const singleUploadData: AssetUploadData = {
          file,
          name: fileName,
          description,
          tags,
          captureMetadata: captureMetadataList?.[i],
        };

        const newAsset = await storageProvider.uploadImage(singleUploadData);
        uploadedAssets.push(newAsset);
        completed++;
        updateBatchItem(set, itemId, {
          completed,
          status: 'success',
          progress: 100,
          message: '上传成功',
        });
      } catch (error) {
        failed++;
        updateBatchItem(set, itemId, {
          failed,
          status: 'error',
          message: error instanceof Error ? error.message : '上传失败',
        });
      }
    }

    const batchStartTime = Date.now();
    set({
      assets: [...get().assets, ...uploadedAssets],
      loading: false,
      batchUploadProgress: null,
    });
    useLogStore
      .getState()
      .addLog(LogActionType.BATCH_UPLOAD, LogStatus.SUCCESS, {
        details: {
          total,
          completed,
          failed,
          assets: uploadedAssets.map(img => ({ id: img.id, name: img.name })),
        },
        duration: Date.now() - batchStartTime,
      });
    return uploadedAssets;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '批量上传失败';
    set({ error: errorMsg, loading: false, batchUploadProgress: null });
    useLogStore
      .getState()
      .addLog(LogActionType.BATCH_UPLOAD, LogStatus.FAILED, {
        error: errorMsg,
        details: { total, completed, failed },
      });
    return uploadedAssets;
  } finally {
    set({ loading: false });
  }
}
