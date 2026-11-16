import type { GiteeConfig, GitHubConfig } from '@pixuli/core/types';
import type { StoragePluginId } from '@/storage/createProvider';
import { useCallback } from 'react';
import { useAssetStore } from '@/features/library/assetStore';
import { getSourceSelectionPort } from '@/features/library/sourceSelectionPort';

/** settings 侧 reactive 读口：内部仍订阅 assetStore，对外不暴露 store */
export function useSourceSelection() {
  const storageType = useAssetStore(state => state.storageType);
  const githubConfig = useAssetStore(state => state.githubConfig);
  const giteeConfig = useAssetStore(state => state.giteeConfig);
  const loading = useAssetStore(state => state.loading);

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
    githubConfig,
    giteeConfig,
    loading,
    setGitHubConfig,
    setGiteeConfig,
    clearGitHubConfig,
    clearGiteeConfig,
    loadAssets,
    setStorageType,
  };
}
