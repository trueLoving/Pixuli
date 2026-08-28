import { loadGiteeConfig } from '@/features/settings/config/gitee';
import { loadGitHubConfig } from '@/features/settings/config/github';
import {
  createConfiguredStorageProvider,
  type StoragePluginId,
} from '@/storage/createProvider';
import type { GiteeConfig, GitHubConfig } from '@pixuli/core/types';
import type { StorageProvider } from '@pixuli/core/plugins';

export type ProviderSessionState = {
  githubConfig: GitHubConfig | null;
  giteeConfig: GiteeConfig | null;
  storageType: StoragePluginId | null;
  storageProvider: StorageProvider | null;
};

export function resolveInitialProviderSession(): ProviderSessionState {
  const githubConfig = loadGitHubConfig();
  const giteeConfig = loadGiteeConfig();
  const storageType: StoragePluginId | null = giteeConfig
    ? 'gitee'
    : githubConfig
      ? 'github'
      : null;
  const initialConfig = giteeConfig || githubConfig;

  return {
    githubConfig,
    giteeConfig,
    storageType,
    storageProvider:
      initialConfig && storageType
        ? createConfiguredStorageProvider(storageType, initialConfig)
        : null,
  };
}

export function createStorageProvider(
  storageType: StoragePluginId,
  config: GitHubConfig | GiteeConfig,
): StorageProvider {
  return createConfiguredStorageProvider(storageType, config);
}

export function resolveActiveRepoConfig(
  storageType: StoragePluginId | null,
  githubConfig: GitHubConfig | null,
  giteeConfig: GiteeConfig | null,
): GitHubConfig | GiteeConfig | null {
  if (storageType === 'gitee') {
    return giteeConfig;
  }
  if (storageType === 'github') {
    return githubConfig;
  }
  return null;
}
