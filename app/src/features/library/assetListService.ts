import {
  storagePluginLabel,
  type StoragePluginId,
} from '@/storage/createProvider';
import { isWorkspaceAvailable } from '@/platforms/workspacePlatform';
import type { ImageItem } from '@pixuli/core/types';
import type { StorageProvider } from '@pixuli/core/plugins';
import { getWorkspaceLibraryPort } from '@/features/library/workspaceImageBridge';

export type AssetListPatch = {
  images?: ImageItem[];
  loading?: boolean;
  error?: string | null;
};

export function isLocalListMode(): boolean {
  return getWorkspaceLibraryPort().isLocalActive();
}

export function shouldSkipRemoteListLoad(): boolean {
  return isWorkspaceAvailable() && !isLocalListMode();
}

export function dedupeImagesById(images: ImageItem[]): ImageItem[] {
  return images.reduce((acc: ImageItem[], current) => {
    const existingIndex = acc.findIndex(img => img.id === current.id);
    if (existingIndex === -1) {
      acc.push(current);
      return acc;
    }
    const existing = acc[existingIndex];
    if (new Date(current.updatedAt) > new Date(existing.updatedAt)) {
      acc[existingIndex] = current;
    }
    return acc;
  }, []);
}

export async function refreshLocalImageList(
  set: (partial: AssetListPatch) => void,
  options?: { quiet?: boolean },
): Promise<void> {
  const workspace = getWorkspaceLibraryPort();
  const quiet = options?.quiet === true;
  if (!quiet) {
    set({ loading: true, error: null });
  }
  try {
    await workspace.refreshLocalImages(quiet ? { quiet: true } : undefined);
    set({
      images: workspace.getLocalImages(),
      loading: false,
    });
  } catch (error) {
    set({
      loading: false,
      error: error instanceof Error ? error.message : '加载本地图片失败',
    });
  }
}

export async function loadRemoteImageList(
  storageProvider: StorageProvider,
): Promise<ImageItem[]> {
  const images = await storageProvider.listImages();
  return dedupeImagesById(images);
}

export function unconfiguredStorageError(
  storageType: StoragePluginId | null,
): string {
  return `${storagePluginLabel(storageType)} 配置未初始化`;
}
