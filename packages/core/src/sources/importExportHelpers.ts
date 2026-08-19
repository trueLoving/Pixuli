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
  return config;
}
