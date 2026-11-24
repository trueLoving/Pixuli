import type { StorageProviderConfig } from '@pixuli/core/plugins';
import type { StoragePluginId } from '@/storage/createProvider';
import { useCallback } from 'react';
import { useAssetStore } from '@/features/library/assetStore';
import { getSourceSelectionPort } from '@/features/library/sourceSelectionPort';

/** settings 侧 reactive 读口：内部仍订阅 assetStore，对外不暴露 store */
export function useSourceSelection() {
  const storageType = useAssetStore(state => state.storageType);
  const storageConfig = useAssetStore(state => state.storageConfig);
  const loading = useAssetStore(state => state.loading);

  const setActiveStorage = useCallback(
    (pluginId: string, config: StorageProviderConfig) =>
      getSourceSelectionPort().setActiveStorage(pluginId, config),
    [],
  );
  const clearActiveStorage = useCallback(
    () => getSourceSelectionPort().clearActiveStorage(),
    [],
  );
  const loadAssets = useCallback(
    () => getSourceSelectionPort().loadAssets(),
    [],
  );
  const setStorageType = useCallback(
    (type: StoragePluginId) => getSourceSelectionPort().setStorageType(type),
    [],
  );

  return {
    storageType,
    storageConfig,
    loading,
    setActiveStorage,
    clearActiveStorage,
    loadAssets,
    setStorageType,
  };
}
