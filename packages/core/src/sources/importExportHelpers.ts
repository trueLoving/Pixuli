import type { StorageProviderConfig } from '../plugins/types';

export function pickRepoConfig(
  raw: Record<string, unknown>,
): StorageProviderConfig | null {
  const owner = raw.owner;
  const repo = raw.repo;
  const token = raw.token;
  if (
    typeof owner !== 'string' ||
    typeof repo !== 'string' ||
    typeof token !== 'string'
  ) {
    return null;
  }
  const config: StorageProviderConfig = { owner, repo, token };
  if (typeof raw.branch === 'string') {
    config.branch = raw.branch;
  }
  if (typeof raw.path === 'string') {
    config.path = raw.path;
  }
  if (
    raw.connectionPurpose === 'backup' ||
    raw.connectionPurpose === 'defaultSync' ||
    raw.connectionPurpose === 'publishChannel'
  ) {
    config.connectionPurpose = raw.connectionPurpose;
  }
  if (typeof raw.private === 'boolean') {
    config.private = raw.private;
  }
  return config;
}

/** 仓库源的可持久化配置；无法识别时返回 null。 */
export function pickStoredSourceConfig(
  raw: Record<string, unknown>,
): StorageProviderConfig | null {
  return pickRepoConfig(raw);
}
