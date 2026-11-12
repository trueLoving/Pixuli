import {
  storagePluginLabel,
  type StoragePluginId,
} from '@/storage/createProvider';
import { isWorkspaceAvailable } from '@/platforms/workspacePlatform';
import type { AssetItem } from '@pixuli/core/types';
import type { StorageProvider } from '@pixuli/core/plugins';
import type { LibraryListScope } from '@/features/library/libraryListScope';
import { getWorkspaceLibraryPort } from '@/features/library/workspaceAssetBridge';

export type AssetListPatch = {
  assets?: AssetItem[];
  /** 当前范围匹配总数；未截断时等于 assets.length */
  libraryTotal?: number;
  loading?: boolean;
  error?: string | null;
};

export function isLocalListMode(): boolean {
  return getWorkspaceLibraryPort().isLocalActive();
}

export function shouldSkipRemoteListLoad(): boolean {
  return isWorkspaceAvailable() && !isLocalListMode();
}

export function dedupeAssetsById(assets: AssetItem[]): AssetItem[] {
  return assets.reduce((acc: AssetItem[], current) => {
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

export async function refreshLocalAssetList(
  set: (partial: AssetListPatch) => void,
  options?: LibraryListScope,
): Promise<void> {
  const workspace = getWorkspaceLibraryPort();
  const quiet = options?.quiet === true;
  if (!quiet) {
    set({ loading: true, error: null });
  }
  try {
    await workspace.refreshLocalAssets(options);
    set({
      assets: workspace.getLocalAssets(),
      libraryTotal: workspace.getScopedTotal(),
      loading: false,
    });
  } catch (error) {
    set({
      loading: false,
      error: error instanceof Error ? error.message : '加载本地图片失败',
    });
  }
}

export async function loadRemoteAssetList(
  storageProvider: StorageProvider,
): Promise<AssetItem[]> {
  const assets = await storageProvider.listImages();
  return dedupeAssetsById(assets);
}

export function unconfiguredStorageError(
  storageType: StoragePluginId | null,
): string {
  return `${storagePluginLabel(storageType)} 配置未初始化`;
}
