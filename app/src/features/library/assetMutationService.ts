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
import type { ImageEditData, ImageItem } from '@pixuli/core/types';
import type { StorageProvider } from '@pixuli/core/plugins';

export type AssetMutationContext = {
  images: ImageItem[];
  storageProvider: StorageProvider | null;
  storageType: StoragePluginId | null;
};

export type AssetMutationSet = (
  partial: Partial<{
    images: ImageItem[];
    loading: boolean;
    error: string | null;
  }>,
) => void;

export async function deleteAssetImage(
  imageId: string,
  fileName: string,
  get: () => AssetMutationContext,
  set: AssetMutationSet,
): Promise<void> {
  const ctx = get();
  if (isLocalListMode()) {
    const image = ctx.images.find(img => img.id === imageId);
    const relativePath = image?.localPath ?? fileName;
    set({ loading: true, error: null });
    try {
      await getWorkspaceLibraryPort().softDeleteLocal(relativePath);
      await refreshLocalImageList(set);
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '删除图片失败',
      });
    }
    return;
  }

  const { storageProvider, storageType } = ctx;
  if (!storageProvider) {
    set({ error: unconfiguredStorageError(storageType), loading: false });
    return;
  }

  set({ loading: true, error: null });
  const startTime = Date.now();
  try {
    await storageProvider.deleteImage(fileName);
    const duration = Date.now() - startTime;
    set({
      images: get().images.filter(img => img.id !== imageId),
      loading: false,
    });
    useLogStore.getState().addLog(LogActionType.DELETE, LogStatus.SUCCESS, {
      imageId,
      imageName: fileName,
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : '删除图片失败';
    set({ error: errorMsg, loading: false });
    useLogStore.getState().addLog(LogActionType.DELETE, LogStatus.FAILED, {
      imageId,
      imageName: fileName,
      error: errorMsg,
      duration,
    });
  } finally {
    set({ loading: false });
  }
}

export async function deleteMultipleAssetImages(
  imageIds: string[],
  fileNames: string[],
  get: () => AssetMutationContext,
  set: AssetMutationSet,
): Promise<void> {
  const ctx = get();
  if (imageIds.length === 0) {
    return;
  }

  const batchLogDetails = {
    imageIds,
    imageNames: fileNames,
    count: imageIds.length,
  };

  if (isLocalListMode()) {
    const startTime = Date.now();
    set({ loading: true, error: null });
    try {
      for (const imageId of imageIds) {
        const image = ctx.images.find(img => img.id === imageId);
        if (image?.localPath) {
          await getWorkspaceLibraryPort().softDeleteLocal(image.localPath);
        }
      }
      await refreshLocalImageList(set);
      useLogStore
        .getState()
        .addLog(LogActionType.BATCH_DELETE, LogStatus.SUCCESS, {
          details: batchLogDetails,
          duration: Date.now() - startTime,
        });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : '批量删除图片失败';
      set({ loading: false, error: errorMsg });
      useLogStore
        .getState()
        .addLog(LogActionType.BATCH_DELETE, LogStatus.FAILED, {
          details: batchLogDetails,
          error: errorMsg,
        });
    }
    return;
  }

  const { storageProvider, storageType } = ctx;
  if (!storageProvider) {
    set({ error: unconfiguredStorageError(storageType), loading: false });
    return;
  }

  set({ loading: true, error: null });
  const startTime = Date.now();
  try {
    await Promise.all(
      fileNames.map(fileName => storageProvider.deleteImage(fileName)),
    );
    const duration = Date.now() - startTime;
    set({
      images: get().images.filter(img => !imageIds.includes(img.id)),
      loading: false,
    });
    useLogStore
      .getState()
      .addLog(LogActionType.BATCH_DELETE, LogStatus.SUCCESS, {
        details: batchLogDetails,
        duration,
      });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg =
      error instanceof Error ? error.message : '批量删除图片失败';
    set({ error: errorMsg, loading: false });
    useLogStore
      .getState()
      .addLog(LogActionType.BATCH_DELETE, LogStatus.FAILED, {
        details: batchLogDetails,
        error: errorMsg,
        duration,
      });
  } finally {
    set({ loading: false });
  }
}

export async function updateAssetImage(
  editData: ImageEditData,
  get: () => AssetMutationContext,
  set: AssetMutationSet,
): Promise<void> {
  const ctx = get();
  const { storageProvider, storageType, images } = ctx;
  const image = images.find(img => img.id === editData.id);
  if (!image) {
    set({ error: '图片不存在', loading: false });
    return;
  }

  if (isLocalListMode()) {
    if (!image.localPath) {
      set({ error: '本地路径缺失', loading: false });
      return;
    }
    set({ loading: true, error: null });
    const startTime = Date.now();
    try {
      const workspace = getWorkspaceLibraryPort();
      let relativePath = image.localPath;
      if (editData.targetFolder !== undefined && relativePath) {
        const slash = relativePath.lastIndexOf('/');
        const currentFolder = slash === -1 ? '' : relativePath.slice(0, slash);
        const nextFolder = editData.targetFolder || 'images';
        if (nextFolder !== currentFolder) {
          await workspace.moveLocalFile(relativePath, nextFolder);
          const fileName = relativePath.slice(slash + 1);
          relativePath = nextFolder ? `${nextFolder}/${fileName}` : fileName;
        }
      }
      await workspace.updateLocalMetadata(relativePath, {
        name: editData.name || image.name,
        description: editData.description ?? image.description,
        tags: editData.tags ?? image.tags,
      });
      await refreshLocalImageList(set);
      useLogStore.getState().addLog(LogActionType.EDIT, LogStatus.SUCCESS, {
        imageId: editData.id,
        imageName: editData.name || image.name,
        duration: Date.now() - startTime,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '更新图片失败';
      set({ error: errorMsg, loading: false });
      useLogStore.getState().addLog(LogActionType.EDIT, LogStatus.FAILED, {
        imageId: editData.id,
        imageName: image.name,
        error: errorMsg,
        duration: Date.now() - startTime,
      });
    }
    return;
  }

  if (!storageProvider) {
    set({ error: unconfiguredStorageError(storageType), loading: false });
    return;
  }

  if (!storageProvider.updateImageMetadata) {
    set({ error: '当前存储插件不支持更新元数据', loading: false });
    return;
  }

  set({ loading: true, error: null });
  const startTime = Date.now();
  try {
    const metadata: ImageItem = {
      ...image,
      name: editData.name || image.name,
      description: editData.description ?? image.description,
      tags: editData.tags ?? image.tags,
      updatedAt: new Date().toISOString(),
    };

    await storageProvider.updateImageMetadata(metadata.name, metadata);

    const duration = Date.now() - startTime;
    set({
      images: get().images.map(img =>
        img.id === editData.id ? { ...img, ...metadata } : img,
      ),
      loading: false,
    });
    useLogStore.getState().addLog(LogActionType.EDIT, LogStatus.SUCCESS, {
      imageId: editData.id,
      imageName: metadata.name,
      duration,
      details: {
        changes: {
          name:
            editData.name !== image.name
              ? { old: image.name, new: editData.name }
              : undefined,
          description:
            editData.description !== image.description
              ? { old: image.description, new: editData.description }
              : undefined,
          tags:
            editData.tags !== image.tags
              ? { old: image.tags, new: editData.tags }
              : undefined,
        },
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : '更新图片失败';
    set({ error: errorMsg, loading: false });
    useLogStore.getState().addLog(LogActionType.EDIT, LogStatus.FAILED, {
      imageId: editData.id,
      imageName: image.name,
      error: errorMsg,
      duration,
    });
  } finally {
    set({ loading: false });
  }
}
