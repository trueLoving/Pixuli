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

/** 仓库源或 OneDrive 源的可持久化配置；无法识别时返回 null。 */
export function pickStoredSourceConfig(
  raw: Record<string, unknown>,
): StorageProviderConfig | null {
  const repo = pickRepoConfig(raw);
  if (repo) {
    return repo;
  }
  if (typeof raw.accessToken !== 'string' || raw.accessToken.length === 0) {
    return null;
  }
  const config: StorageProviderConfig = {
    accessToken: raw.accessToken,
    path:
      typeof raw.path === 'string' && raw.path.length > 0 ? raw.path : 'Pixuli',
  };
  if (typeof raw.refreshToken === 'string') {
    config.refreshToken = raw.refreshToken;
  }
  if (typeof raw.clientId === 'string') {
    config.clientId = raw.clientId;
  }
  if (typeof raw.expiresAt === 'number' && Number.isFinite(raw.expiresAt)) {
    config.expiresAt = raw.expiresAt;
  }
  if (
    raw.connectionPurpose === 'backup' ||
    raw.connectionPurpose === 'defaultSync' ||
    raw.connectionPurpose === 'publishChannel'
  ) {
    config.connectionPurpose = raw.connectionPurpose;
  }
  return config;
}
