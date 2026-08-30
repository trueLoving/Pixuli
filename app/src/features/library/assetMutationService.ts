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
  options?: { quiet?: boolean },
): Promise<boolean> {
  const ctx = get();
  const { storageProvider, storageType, images } = ctx;
  const image = images.find(img => img.id === editData.id);
  if (!image) {
    if (!options?.quiet) {
      set({ error: '图片不存在', loading: false });
    }
    return false;
  }

  if (isLocalListMode()) {
    if (!image.localPath) {
      if (!options?.quiet) {
        set({ error: '本地路径缺失', loading: false });
      }
      return false;
    }
    if (!options?.quiet) {
      set({ loading: true, error: null });
    }
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
      await refreshLocalImageList(set, { quiet: true });
      useLogStore.getState().addLog(LogActionType.EDIT, LogStatus.SUCCESS, {
        imageId: editData.id,
        imageName: editData.name || image.name,
        duration: Date.now() - startTime,
      });
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '更新图片失败';
      if (!options?.quiet) {
        set({ error: errorMsg, loading: false });
      }
      useLogStore.getState().addLog(LogActionType.EDIT, LogStatus.FAILED, {
        imageId: editData.id,
        imageName: image.name,
        error: errorMsg,
        duration: Date.now() - startTime,
      });
      return false;
    } finally {
      if (!options?.quiet) {
        set({ loading: false });
      }
    }
  }

  if (!storageProvider) {
    if (!options?.quiet) {
      set({ error: unconfiguredStorageError(storageType), loading: false });
    }
    return false;
  }

  if (!storageProvider.updateImageMetadata) {
    if (!options?.quiet) {
      set({ error: '当前存储插件不支持更新元数据', loading: false });
    }
    return false;
  }

  if (!options?.quiet) {
    set({ loading: true, error: null });
  }
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
      ...(options?.quiet ? {} : { loading: false }),
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
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : '更新图片失败';
    if (!options?.quiet) {
      set({ error: errorMsg, loading: false });
    }
    useLogStore.getState().addLog(LogActionType.EDIT, LogStatus.FAILED, {
      imageId: editData.id,
      imageName: image.name,
      error: errorMsg,
      duration,
    });
    return false;
  } finally {
    if (!options?.quiet) {
      set({ loading: false });
    }
  }
}

export type BatchMetadataPatch = {
  /** 追加到每个文件现有标签（去重） */
  tagsToAppend: string[];
  /** 为 true 时，用 description 统一覆盖所有选中项（可为空字符串） */
  updateDescription: boolean;
  description: string;
};

function mergeTagsAppend(
  existing: string[] | undefined,
  toAppend: string[],
): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const tag of [...(existing ?? []), ...toAppend]) {
    const trimmed = tag.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    merged.push(trimmed);
  }
  return merged;
}

export async function batchUpdateAssetMetadata(
  imageIds: string[],
  patch: BatchMetadataPatch,
  get: () => AssetMutationContext,
  set: AssetMutationSet,
): Promise<{ updated: number; failed: number }> {
  if (imageIds.length === 0) {
    return { updated: 0, failed: 0 };
  }

  const tagsToAppend = patch.tagsToAppend
    .map(tag => tag.trim())
    .filter(Boolean);

  if (tagsToAppend.length === 0 && !patch.updateDescription) {
    return { updated: 0, failed: 0 };
  }

  let updated = 0;
  let failed = 0;
  const startTime = Date.now();

  set({ loading: true, error: null });

  for (const imageId of imageIds) {
    const image = get().images.find(item => item.id === imageId);
    if (!image) {
      failed++;
      continue;
    }

    const nextTags = mergeTagsAppend(image.tags, tagsToAppend);
    const tagsChanged =
      tagsToAppend.length > 0 &&
      JSON.stringify(nextTags) !== JSON.stringify(image.tags ?? []);
    const descriptionChanged =
      patch.updateDescription &&
      patch.description !== (image.description ?? '');

    if (!tagsChanged && !descriptionChanged) {
      updated++;
      continue;
    }

    try {
      const ok = await updateAssetImage(
        {
          id: image.id,
          name: image.name,
          ...(patch.updateDescription
            ? { description: patch.description }
            : {}),
          tags: nextTags,
        },
        get,
        set,
        { quiet: true },
      );
      if (ok) updated++;
      else failed++;
    } catch {
      failed++;
    }
  }

  await refreshLocalImageList(set, { quiet: true }).catch(() => undefined);
  set({ loading: false });

  useLogStore.getState().addLog(LogActionType.EDIT, LogStatus.SUCCESS, {
    duration: Date.now() - startTime,
    details: {
      batchMetadata: true,
      total: imageIds.length,
      updated,
      failed,
    },
  });

  return { updated, failed };
}
