import { useCallback } from 'react';
import { useImageStore } from '@/features/library/imageStore';
import { useSourceStore } from '@/features/settings/sourceStore';
import { useUIStore } from '@/stores/uiStore';

/**
 * 配置管理相关的 hooks
 */
export function useConfigManagement() {
  const {
    storageType,
    setGitHubConfig,
    setGiteeConfig,
    clearGitHubConfig,
    clearGiteeConfig,
    loadImages,
  } = useImageStore();
  const { addSource, updateSource, removeSource, setSelectedSourceId } =
    useSourceStore();

  const handleSaveConfig = useCallback(
    (
      config: {
        owner: string;
        repo: string;
        branch: string;
        token: string;
        path: string;
        name?: string;
      },
      editingSourceId: string | null,
    ) => {
      const label = config.name || `${config.owner}/${config.repo}`;
      const repoConfig = {
        owner: config.owner,
        repo: config.repo,
        branch: config.branch,
        token: config.token,
        path: config.path,
      };

      const editingSource = editingSourceId
        ? useSourceStore.getState().getSourceById(editingSourceId)
        : undefined;
      const activePluginId = editingSource?.pluginId ?? storageType;

      if (editingSourceId) {
        updateSource(editingSourceId, {
          label,
          config: repoConfig,
        });
      } else {
        const purpose =
          useUIStore.getState().pendingConnectionPurpose ?? 'defaultSync';
        const newSource = addSource({
          pluginId: storageType!,
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

      if (activePluginId === 'github') {
        setGitHubConfig(repoConfig);
      } else if (activePluginId === 'gitee') {
        setGiteeConfig(repoConfig);
      }

      setTimeout(() => {
        loadImages();
      }, 100);
    },
    [
      storageType,
      addSource,
      updateSource,
      setSelectedSourceId,
      setGitHubConfig,
      setGiteeConfig,
      loadImages,
    ],
  );

  const handleClearConfig = useCallback(
    (editingSourceId: string | null) => {
      if (editingSourceId) {
        removeSource(editingSourceId);
        setSelectedSourceId(null);
      }
      if (storageType === 'github') {
        clearGitHubConfig();
      } else if (storageType === 'gitee') {
        clearGiteeConfig();
      }
    },
    [
      storageType,
      removeSource,
      setSelectedSourceId,
      clearGitHubConfig,
      clearGiteeConfig,
    ],
  );

  return {
    handleSaveConfig,
    handleClearConfig,
  };
}
