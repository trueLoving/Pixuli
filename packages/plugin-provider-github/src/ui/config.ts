import type { StorageProviderConfig } from '@pixuli/core/plugins';

export type GitHubFieldValues = {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  path: string;
  private?: boolean;
};

export const EMPTY_GITHUB_VALUES: GitHubFieldValues = {
  owner: '',
  repo: '',
  branch: 'main',
  token: '',
  path: 'images',
};

export function storageConfigToFields(
  config: StorageProviderConfig | null | undefined,
): GitHubFieldValues {
  if (!config) return { ...EMPTY_GITHUB_VALUES };
  return {
    owner: String(config.owner ?? ''),
    repo: String(config.repo ?? ''),
    branch: String(config.branch ?? 'main'),
    token: String(config.token ?? ''),
    path: String(config.path ?? 'images'),
    ...(typeof config.private === 'boolean' ? { private: config.private } : {}),
  };
}

export function fieldsToStorageConfig(
  values: GitHubFieldValues,
): StorageProviderConfig {
  return {
    owner: values.owner,
    repo: values.repo,
    branch: values.branch,
    token: values.token,
    path: values.path,
    ...(typeof values.private === 'boolean' ? { private: values.private } : {}),
  };
}

export function mergeFieldPatch(
  current: StorageProviderConfig,
  patch: Partial<GitHubFieldValues>,
): StorageProviderConfig {
  const base = storageConfigToFields(current);
  return fieldsToStorageConfig({ ...base, ...patch });
}

export function isGitHubConfigComplete(config: StorageProviderConfig): boolean {
  const values = storageConfigToFields(config);
  return Boolean(
    values.owner.trim() &&
      values.repo.trim() &&
      values.branch.trim() &&
      values.path.trim(),
  );
}
