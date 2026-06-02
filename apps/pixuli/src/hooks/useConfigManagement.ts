import { useCallback } from 'react';
import { useImageStore } from '../stores/imageStore';
import { useSourceStore } from '../stores/sourceStore';

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

      if (editingSourceId) {
        updateSource(editingSourceId, {
          label,
          config: repoConfig,
        });
      } else {
        const newSource = addSource({
          pluginId: storageType!,
          label,
          config: repoConfig,
        });
        setSelectedSourceId(newSource.id);
      }

      if (storageType === 'github') {
        setGitHubConfig(repoConfig);
      } else {
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
