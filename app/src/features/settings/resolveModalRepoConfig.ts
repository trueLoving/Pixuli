import {
  getRepoConfigFromSource,
  resolveSourceDisplay,
  type StoredSourceEntry,
} from '@pixuli/core/sources';
import type { GiteeConfig, GitHubConfig } from '@pixuli/core/types';

type RepoConfigFields = Pick<
  GitHubConfig,
  'owner' | 'repo' | 'branch' | 'token' | 'path'
>;

/**
 * 配置弹窗展示用：编辑态优先从 sourceStore 条目读取（与 pixuli.sources.v3 一致）。
 */
export function resolveModalRepoConfig(
  plugin: 'github' | 'gitee',
  options: {
    editingSourceId: string | null;
    editingSourcePluginId: string | null;
    editingSourceRepoConfig: RepoConfigFields | null;
    editingSource: StoredSourceEntry | null | undefined;
    fallbackGithub: GitHubConfig | null;
    fallbackGitee: GiteeConfig | null;
  },
): GitHubConfig | GiteeConfig | null {
  const {
    editingSourceId,
    editingSourcePluginId,
    editingSourceRepoConfig,
    editingSource,
    fallbackGithub,
    fallbackGitee,
  } = options;

  if (editingSourceId && editingSourceRepoConfig && editingSourcePluginId) {
    if (resolveSourceDisplay(editingSourcePluginId).legacyType === plugin) {
      return { ...editingSourceRepoConfig } as GitHubConfig | GiteeConfig;
    }
    return null;
  }

  if (editingSourceId && editingSource) {
    const legacy = resolveSourceDisplay(editingSource.pluginId).legacyType;
    if (legacy === plugin) {
      return getRepoConfigFromSource(editingSource) as
        | GitHubConfig
        | GiteeConfig;
    }
    return null;
  }

  return plugin === 'github' ? fallbackGithub : fallbackGitee;
}

export function configFieldsKey(config: RepoConfigFields | null): string {
  if (!config) {
    return 'empty';
  }
  return [
    config.owner,
    config.repo,
    config.branch,
    config.token,
    config.path,
  ].join('\u0001');
}
