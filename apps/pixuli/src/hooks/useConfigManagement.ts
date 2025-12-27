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
    (config: any, editingSourceId: string | null) => {
      if (editingSourceId) {
        // 编辑现有源
        updateSource(editingSourceId, {
          ...config,
          name: config.name || `${config.owner}/${config.repo}`,
        });
      } else {
        // 添加新源
        const newSource = addSource({
          type: storageType!,
          name: `${config.owner}/${config.repo}`,
          ...config,
        });
        setSelectedSourceId(newSource.id);
      }

      // 切换到保存的源并加载图片
      const sourceConfig = {
        owner: config.owner,
        repo: config.repo,
        branch: config.branch,
        token: config.token,
        path: config.path,
      };

      if (storageType === 'github') {
        setGitHubConfig(sourceConfig);
      } else {
        setGiteeConfig(sourceConfig);
      }

      // 延迟加载，确保配置已更新
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
      // 如果正在编辑现有源，则移除该源
      if (editingSourceId) {
        removeSource(editingSourceId);
        setSelectedSourceId(null);
      }
      // 根据存储类型清除相应的配置
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
