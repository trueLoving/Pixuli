import type { StorageProviderConfig } from '@pixuli/core/plugins';
import { useCallback } from 'react';
import { useAssetStore } from '@/features/library/assetStore';
import { useSourceSelection } from '@/features/library/useSourceSelection';
import { useSourceStore } from '@/features/settings/sourceStore';
import { useUIStore } from '@/stores/uiStore';

/**
 * 配置管理相关的 hooks
 */
export function useConfigManagement() {
  const { storageType, setActiveStorage, clearActiveStorage, loadAssets } =
    useSourceSelection();
  const { addSource, updateSource, removeSource, setSelectedSourceId } =
    useSourceStore();

  const handleSaveConfig = useCallback(
    (config: StorageProviderConfig, editingSourceId: string | null) => {
      const owner = String(config.owner ?? '');
      const repo = String(config.repo ?? '');
      const name = typeof config.name === 'string' ? config.name : undefined;
      const label = name || `${owner}/${repo}`;
      const repoConfig: StorageProviderConfig = { ...config };
      delete repoConfig.name;

      const editingSource = editingSourceId
        ? useSourceStore.getState().getSourceById(editingSourceId)
        : undefined;
      const liveStorageType = useAssetStore.getState().storageType;
      const activePluginId =
        editingSource?.pluginId ?? liveStorageType ?? undefined;

      if (editingSourceId) {
        updateSource(editingSourceId, {
          label,
          config: repoConfig,
        });
      } else {
        const purpose =
          useUIStore.getState().pendingConnectionPurpose ?? 'defaultSync';
        if (!liveStorageType) {
          return;
        }
        const newSource = addSource({
          pluginId: liveStorageType,
          label,
          config: { ...repoConfig, connectionPurpose: purpose },
        });
        const shouldSelect =
          purpose === 'defaultSync' ||
          useSourceStore.getState().selectedSourceId == null;
        if (shouldSelect) {
          setSelectedSourceId(newSource.id);
        }
        useUIStore.setState({ pendingConnectionPurpose: null });
      }

      if (activePluginId) {
        setActiveStorage(activePluginId, repoConfig);
      }

      setTimeout(() => {
        void loadAssets();
      }, 100);
    },
    [
      storageType,
      addSource,
      updateSource,
      setSelectedSourceId,
      setActiveStorage,
      loadAssets,
    ],
  );

  const handleClearConfig = useCallback(
    (editingSourceId: string | null) => {
      if (editingSourceId) {
        removeSource(editingSourceId);
        setSelectedSourceId(null);
      }
      clearActiveStorage();
    },
    [removeSource, setSelectedSourceId, clearActiveStorage],
  );

  return {
    handleSaveConfig,
    handleClearConfig,
  };
}
