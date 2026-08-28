import {
  LogActionType,
  LogStatus,
  useLogStore,
} from '@/features/operation-log';
import { getWorkspaceLibraryPort } from '@/features/library/workspaceImageBridge';
import {
  isLocalListMode,
  refreshLocalImageList,
  unconfiguredStorageError,
} from '@/features/library/assetListService';
import type { StoragePluginId } from '@/storage/createProvider';
import type {
  BatchUploadProgress,
  ImageItem,
  ImageUploadData,
  MultiImageUploadData,
  UploadProgress,
} from '@pixuli/core/types';
import { getUploadFileName } from '@pixuli/core/types';
import type { StorageProvider } from '@pixuli/core/plugins';

export type AssetUploadContext = {
  images: ImageItem[];
  storageProvider: StorageProvider | null;
  storageType: StoragePluginId | null;
};

export type AssetUploadSet = (
  partial:
    | Partial<{
        images: ImageItem[];
        loading: boolean;
        error: string | null;
        batchUploadProgress: BatchUploadProgress | null;
      }>
    | ((state: {
        images: ImageItem[];
        batchUploadProgress: BatchUploadProgress | null;
      }) => Partial<{
        images: ImageItem[];
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

export async function uploadAssetImage(
  uploadData: ImageUploadData,
  get: () => AssetUploadContext,
  set: AssetUploadSet,
): Promise<ImageItem | null> {
  const ctx = get();
  if (isLocalListMode()) {
    const imported =
      await getWorkspaceLibraryPort().importLocalImage(uploadData);
    await refreshLocalImageList(set, { quiet: true });
    if (!imported) {
      return null;
    }
    return get().images.find(image => image.id === imported.id) ?? imported;
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
    const newImage = await storageProvider.uploadImage(uploadData);
    const duration = Date.now() - startTime;
    set({
      images: get().images.some(img => img.id === newImage.id)
        ? get().images.map(img => (img.id === newImage.id ? newImage : img))
        : [...get().images, newImage],
      loading: false,
    });
    useLogStore.getState().addLog(LogActionType.UPLOAD, LogStatus.SUCCESS, {
      imageId: newImage.id,
      imageName: newImage.name,
      duration,
      details: {
        size: newImage.size,
        type: newImage.type,
        capture: newImage.captureMetadata,
      },
    });
    return newImage;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : '上传图片失败';
    set({ error: errorMsg, loading: false });
    useLogStore.getState().addLog(LogActionType.UPLOAD, LogStatus.FAILED, {
      imageName: getUploadFileName(uploadData.file, uploadData.name),
      error: errorMsg,
      duration,
    });
    return null;
  } finally {
    set({ loading: false });
  }
}

export async function uploadMultipleAssetImages(
  uploadData: MultiImageUploadData,
  get: () => AssetUploadContext,
  set: AssetUploadSet,
): Promise<ImageItem[]> {
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
    const imported: ImageItem[] = [];
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
          const created = await getWorkspaceLibraryPort().importLocalImage({
            file,
            name,
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

      await refreshLocalImageList(set, { quiet: true });
      set({ batchUploadProgress: null });
      useLogStore
        .getState()
        .addLog(LogActionType.BATCH_UPLOAD, LogStatus.SUCCESS, {
          details: { total, completed, failed },
          duration: Date.now() - startTime,
        });
      const importedIds = new Set(imported.map(item => item.id));
      return get().images.filter(image => importedIds.has(image.id));
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
  const uploadedImages: ImageItem[] = [];

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
        const singleUploadData: ImageUploadData = {
          file,
          name: fileName,
          description,
          tags,
          captureMetadata: captureMetadataList?.[i],
        };

        const newImage = await storageProvider.uploadImage(singleUploadData);
        uploadedImages.push(newImage);
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
      images: [...get().images, ...uploadedImages],
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
          images: uploadedImages.map(img => ({ id: img.id, name: img.name })),
        },
        duration: Date.now() - batchStartTime,
      });
    return uploadedImages;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '批量上传失败';
    set({ error: errorMsg, loading: false, batchUploadProgress: null });
    useLogStore
      .getState()
      .addLog(LogActionType.BATCH_UPLOAD, LogStatus.FAILED, {
        error: errorMsg,
        details: { total, completed, failed },
      });
    return uploadedImages;
  } finally {
    set({ loading: false });
  }
}
