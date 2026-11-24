import {
  getRepoConfigFromSource,
  type StoredSourceEntry,
} from '@pixuli/core/sources';
import type { StorageProviderConfig } from '@pixuli/core/plugins';
import { getSourceSelectionPort } from '@/features/library/sourceSelectionPort';

export type RepoConfigFields = {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  path: string;
  private?: boolean;
};

/** 将仓库连接字段写入资源库当前激活会话 */
export function syncRepoConfigToAssetStore(
  pluginId: string,
  repoConfig: RepoConfigFields,
): void {
  const port = getSourceSelectionPort();
  port.setActiveStorage(pluginId, repoConfig as StorageProviderConfig);
}

/** 选中/编辑源时同步 storageType 与仓库配置 */
export function syncSourceEntryToAssetStore(source: StoredSourceEntry): void {
  const port = getSourceSelectionPort();
  port.setStorageType(source.pluginId);
  syncRepoConfigToAssetStore(source.pluginId, getRepoConfigFromSource(source));
}
