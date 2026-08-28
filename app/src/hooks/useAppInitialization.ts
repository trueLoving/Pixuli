import { useEffect } from 'react';
import { useImageStore } from '@/features/library/imageStore';
import { useSourceStore } from '../stores/sourceStore';

/**
 * 应用初始化相关的 hooks
 */
export function useAppInitialization(
  hasConfig: boolean,
  handleLoadImages: () => Promise<void>,
) {
  const { storageType, githubConfig, giteeConfig } = useImageStore();
  const { selectedSourceId, setSelectedSourceId, sources } = useSourceStore();

  // 初始化：如果没有选中源但有源列表，自动选中第一个
  useEffect(() => {
    if (!selectedSourceId && sources.length > 0) {
      setSelectedSourceId(sources[0].id);
    }
  }, [selectedSourceId, sources, setSelectedSourceId]);

  // 初始化存储服务并加载图片
  // 注意：如果使用仓库源模式，图片加载由 useSelectedSourceSync 的回调触发
  useEffect(() => {
    // local 工作区由 workspace 初始化触发加载
    if (hasConfig) {
      return;
    }

    // 如果没有使用仓库源模式，使用旧的配置方式加载
    const { storageType, githubConfig, giteeConfig, initializeStorage } =
      useImageStore.getState();

    // 如果有配置，初始化存储服务并加载图片
    if (
      (storageType === 'github' && githubConfig) ||
      (storageType === 'gitee' && giteeConfig)
    ) {
      initializeStorage();
      handleLoadImages();
    }
  }, [
    storageType,
    githubConfig,
    giteeConfig,
    handleLoadImages,
    hasConfig,
    sources,
  ]);

  // 页面加载时初始化
  useEffect(() => {
    const {
      storageType,
      githubConfig,
      giteeConfig,
      storageProvider,
      initializeStorage,
    } = useImageStore.getState();
    if (
      !storageProvider &&
      ((storageType === 'github' && githubConfig) ||
        (storageType === 'gitee' && giteeConfig))
    ) {
      initializeStorage();
    }
  }, []);
}
