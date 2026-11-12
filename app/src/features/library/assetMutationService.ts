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
import type { AssetEditData, AssetItem } from '@pixuli/core/types';
import type { StorageProvider } from '@pixuli/core/plugins';

export type AssetMutationContext = {
  assets: AssetItem[];
  storageProvider: StorageProvider | null;
  storageType: StoragePluginId | null;
};

export type AssetMutationSet = (
  partial: Partial<{
    assets: AssetItem[];
    loading: boolean;
    error: string | null;
  }>,
) => void;

export async function deleteAsset(
  assetId: string,
  fileName: string,
  get: () => AssetMutationContext,
  set: AssetMutationSet,
): Promise<void> {
  const ctx = get();
  if (isLocalListMode()) {
    const asset = ctx.assets.find(item => item.id === assetId);
    const relativePath = asset?.localPath ?? fileName;
    set({ loading: true, error: null });
    try {
      await getWorkspaceLibraryPort().softDeleteLocal(relativePath);
      await refreshLocalAssetList(set);
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
      assets: get().assets.filter(item => item.id !== assetId),
      loading: false,
    });
    useLogStore.getState().addLog(LogActionType.DELETE, LogStatus.SUCCESS, {
      assetId,
      assetName: fileName,
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : '删除图片失败';
    set({ error: errorMsg, loading: false });
    useLogStore.getState().addLog(LogActionType.DELETE, LogStatus.FAILED, {
      assetId,
      assetName: fileName,
      error: errorMsg,
      duration,
    });
  } finally {
    set({ loading: false });
  }
}

export async function deleteMultipleAssets(
  assetIds: string[],
  fileNames: string[],
  get: () => AssetMutationContext,
  set: AssetMutationSet,
): Promise<void> {
  const ctx = get();
  if (assetIds.length === 0) {
    return;
  }

  const batchLogDetails = {
    assetIds,
    assetNames: fileNames,
    count: assetIds.length,
  };

  if (isLocalListMode()) {
    const startTime = Date.now();
    set({ loading: true, error: null });
    try {
      for (const assetId of assetIds) {
        const asset = ctx.assets.find(item => item.id === assetId);
        if (asset?.localPath) {
          await getWorkspaceLibraryPort().softDeleteLocal(asset.localPath);
        }
      }
      await refreshLocalAssetList(set);
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
      assets: get().assets.filter(img => !assetIds.includes(img.id)),
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

export async function updateAsset(
  editData: AssetEditData,
  get: () => AssetMutationContext,
  set: AssetMutationSet,
  options?: { quiet?: boolean },
): Promise<boolean> {
  const ctx = get();
  const { storageProvider, storageType, assets } = ctx;
  const asset = assets.find(item => item.id === editData.id);
  if (!asset) {
    if (!options?.quiet) {
      set({ error: '图片不存在', loading: false });
    }
    return false;
  }

  if (isLocalListMode()) {
    if (!asset.localPath) {
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
      let relativePath = asset.localPath;
      if (editData.targetFolder !== undefined && relativePath) {
        const slash = relativePath.lastIndexOf('/');
        const currentFolder = slash === -1 ? '' : relativePath.slice(0, slash);
        const nextFolder =
          !editData.targetFolder || editData.targetFolder === '__root__'
            ? ''
            : editData.targetFolder.replace(/\/+$/, '');
        if (nextFolder !== currentFolder) {
          await workspace.moveLocalFile(relativePath, nextFolder);
          const fileName = relativePath.slice(slash + 1);
          relativePath = nextFolder ? `${nextFolder}/${fileName}` : fileName;
        }
      }
      await workspace.updateLocalMetadata(relativePath, {
        name: editData.name || asset.name,
        description: editData.description ?? asset.description,
        tags: editData.tags ?? asset.tags,
      });
      await refreshLocalAssetList(set, { quiet: true });
      useLogStore.getState().addLog(LogActionType.EDIT, LogStatus.SUCCESS, {
        assetId: editData.id,
        assetName: editData.name || asset.name,
        duration: Date.now() - startTime,
      });
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '更新图片失败';
      if (!options?.quiet) {
        set({ error: errorMsg, loading: false });
      }
      useLogStore.getState().addLog(LogActionType.EDIT, LogStatus.FAILED, {
        assetId: editData.id,
        assetName: asset.name,
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
    const metadata: AssetItem = {
      ...asset,
      name: editData.name || asset.name,
      description: editData.description ?? asset.description,
      tags: editData.tags ?? asset.tags,
      updatedAt: new Date().toISOString(),
    };

    await storageProvider.updateImageMetadata(metadata.name, metadata);

    const duration = Date.now() - startTime;
    set({
      assets: get().assets.map(item =>
        item.id === editData.id ? { ...img, ...metadata } : img,
      ),
      ...(options?.quiet ? {} : { loading: false }),
    });
    useLogStore.getState().addLog(LogActionType.EDIT, LogStatus.SUCCESS, {
      assetId: editData.id,
      assetName: metadata.name,
      duration,
      details: {
        changes: {
          name:
            editData.name !== asset.name
              ? { old: asset.name, new: editData.name }
              : undefined,
          description:
            editData.description !== asset.description
              ? { old: asset.description, new: editData.description }
              : undefined,
          tags:
            editData.tags !== asset.tags
              ? { old: asset.tags, new: editData.tags }
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
      assetId: editData.id,
      assetName: asset.name,
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
  assetIds: string[],
  patch: BatchMetadataPatch,
  get: () => AssetMutationContext,
  set: AssetMutationSet,
): Promise<{ updated: number; failed: number }> {
  if (assetIds.length === 0) {
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

  for (const assetId of assetIds) {
    const asset = get().assets.find(item => item.id === assetId);
    if (!asset) {
      failed++;
      continue;
    }

    const nextTags = mergeTagsAppend(asset.tags, tagsToAppend);
    const tagsChanged =
      tagsToAppend.length > 0 &&
      JSON.stringify(nextTags) !== JSON.stringify(asset.tags ?? []);
    const descriptionChanged =
      patch.updateDescription &&
      patch.description !== (asset.description ?? '');

    if (!tagsChanged && !descriptionChanged) {
      updated++;
      continue;
    }

    try {
      const ok = await updateAsset(
        {
          id: asset.id,
          name: asset.name,
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

  await refreshLocalAssetList(set, { quiet: true }).catch(() => undefined);
  set({ loading: false });

  useLogStore.getState().addLog(LogActionType.EDIT, LogStatus.SUCCESS, {
    duration: Date.now() - startTime,
    details: {
      batchMetadata: true,
      total: assetIds.length,
      updated,
      failed,
    },
  });

  return { updated, failed };
}
