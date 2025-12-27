import { useEffect } from 'react';
import { getDemoGitHubConfig, getDemoGiteeConfig } from '@packages/common/src';
import { useImageStore } from '../stores/imageStore';
import { useSourceStore } from '../stores/sourceStore';

/**
 * 应用初始化相关的 hooks
 */
export function useAppInitialization(
  isDemoMode: boolean,
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

  // Demo 模式：自动加载 Demo 配置（不保存到 localStorage）
  useEffect(() => {
    if (isDemoMode && !hasConfig && !githubConfig && !giteeConfig) {
      // 优先使用 GitHub Demo 配置
      const demoGitHubConfig = getDemoGitHubConfig();
      if (
        demoGitHubConfig.config.owner &&
        demoGitHubConfig.config.repo &&
        demoGitHubConfig.config.token
      ) {
        // Demo 模式下直接设置到 store，不保存到 localStorage
        useImageStore.setState({
          githubConfig: demoGitHubConfig.config,
          giteeConfig: null,
          storageType: 'github',
        });
        useImageStore.getState().initializeStorage();
        return;
      }

      // 如果没有 GitHub 配置，尝试使用 Gitee Demo 配置
      const demoGiteeConfig = getDemoGiteeConfig();
      if (
        demoGiteeConfig.config.owner &&
        demoGiteeConfig.config.repo &&
        demoGiteeConfig.config.token
      ) {
        // Demo 模式下直接设置到 store，不保存到 localStorage
        useImageStore.setState({
          giteeConfig: demoGiteeConfig.config,
          githubConfig: null,
          storageType: 'gitee',
        });
        useImageStore.getState().initializeStorage();
      }
    }
  }, [isDemoMode, hasConfig, githubConfig, giteeConfig]);

  // 初始化存储服务并加载图片（Demo 模式下不自动加载）
  // 注意：如果使用仓库源模式，图片加载由 useSelectedSourceSync 的回调触发
  useEffect(() => {
    // Demo 模式下不自动加载图片
    if (isDemoMode) {
      return;
    }

    // 如果使用仓库源模式（hasConfig），不在这里加载，由 useSelectedSourceSync 处理
    if (hasConfig && sources.length > 0) {
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
    isDemoMode,
    hasConfig,
    sources,
  ]);

  // 页面加载时初始化
  useEffect(() => {
    const {
      storageType,
      githubConfig,
      giteeConfig,
      storageService,
      initializeStorage,
    } = useImageStore.getState();
    if (
      !storageService &&
      ((storageType === 'github' && githubConfig) ||
        (storageType === 'gitee' && giteeConfig))
    ) {
      initializeStorage();
    }
  }, []);
}
