import {
  getRepoConfigFromSource,
  pluginIdToLegacyType,
  type StoredSourceEntry,
} from '@pixuli/core/sources';
import type { GiteeConfig, GitHubConfig } from '@pixuli/core/types';
import { useImageStore } from '@/features/library/imageStore';

export type RepoConfigFields = Pick<
  GitHubConfig,
  'owner' | 'repo' | 'branch' | 'token' | 'path'
>;

/** 将仓库连接字段写入 imageStore（GitHub/Gitee 双轨 legacy 配置） */
export function syncRepoConfigToImageStore(
  pluginId: string,
  repoConfig: RepoConfigFields,
): void {
  const legacyType = pluginIdToLegacyType(pluginId);
  const { setGitHubConfig, setGiteeConfig } = useImageStore.getState();
  if (legacyType === 'github') {
    setGitHubConfig(repoConfig as GitHubConfig);
  } else {
    setGiteeConfig(repoConfig as GiteeConfig);
  }
}

/** 选中/编辑源时同步 storageType 与仓库配置 */
export function syncSourceEntryToImageStore(source: StoredSourceEntry): void {
  const legacyType = pluginIdToLegacyType(source.pluginId);
  useImageStore.setState({ storageType: legacyType });
  syncRepoConfigToImageStore(source.pluginId, getRepoConfigFromSource(source));
}
