import {
  getRepoConfigFromSource,
  pluginIdToLegacyType,
  type StoredSourceEntry,
} from '@pixuli/core/sources';
import type { GiteeConfig, GitHubConfig } from '@pixuli/core/types';
import { getSourceSelectionPort } from '@/features/library/sourceSelectionPort';

export type RepoConfigFields = Pick<
  GitHubConfig,
  'owner' | 'repo' | 'branch' | 'token' | 'path'
>;

/** 将仓库连接字段写入资源库（GitHub/Gitee 双轨 legacy 配置） */
export function syncRepoConfigToImageStore(
  pluginId: string,
  repoConfig: RepoConfigFields,
): void {
  const legacyType = pluginIdToLegacyType(pluginId);
  const port = getSourceSelectionPort();
  if (legacyType === 'github') {
    port.setGitHubConfig(repoConfig as GitHubConfig);
  } else {
    port.setGiteeConfig(repoConfig as GiteeConfig);
  }
}

/** 选中/编辑源时同步 storageType 与仓库配置 */
export function syncSourceEntryToImageStore(source: StoredSourceEntry): void {
  const legacyType = pluginIdToLegacyType(source.pluginId);
  const port = getSourceSelectionPort();
  port.setStorageType(legacyType);
  syncRepoConfigToImageStore(source.pluginId, getRepoConfigFromSource(source));
}
