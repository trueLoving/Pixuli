import type { GiteeConfig, GitHubConfig } from '@pixuli/core/types';
import type { StoragePluginId } from '@/storage/createProvider';
import { useCallback } from 'react';
import { useImageStore } from '@/features/library/imageStore';
import { getSourceSelectionPort } from '@/features/library/sourceSelectionPort';

/** settings 侧 reactive 读口：内部仍订阅 imageStore，对外不暴露 store */
export function useSourceSelection() {
  const storageType = useImageStore(state => state.storageType);
  const githubConfig = useImageStore(state => state.githubConfig);
  const giteeConfig = useImageStore(state => state.giteeConfig);
  const loading = useImageStore(state => state.loading);

  const setGitHubConfig = useCallback(
    (config: GitHubConfig) => getSourceSelectionPort().setGitHubConfig(config),
    [],
  );
  const setGiteeConfig = useCallback(
    (config: GiteeConfig) => getSourceSelectionPort().setGiteeConfig(config),
    [],
  );
  const clearGitHubConfig = useCallback(
    () => getSourceSelectionPort().clearGitHubConfig(),
    [],
  );
  const clearGiteeConfig = useCallback(
    () => getSourceSelectionPort().clearGiteeConfig(),
    [],
  );
  const loadImages = useCallback(
    () => getSourceSelectionPort().loadImages(),
    [],
  );
  const setStorageType = useCallback(
    (type: StoragePluginId) => getSourceSelectionPort().setStorageType(type),
    [],
  );

  return {
    storageType,
    githubConfig,
    giteeConfig,
    loading,
    setGitHubConfig,
    setGiteeConfig,
    clearGitHubConfig,
    clearGiteeConfig,
    loadImages,
    setStorageType,
  };
}
