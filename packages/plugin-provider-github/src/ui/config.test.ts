import { describe, expect, it } from 'vitest';
import {
  EMPTY_GITHUB_VALUES,
  fieldsToStorageConfig,
  isGitHubConfigComplete,
  mergeFieldPatch,
  storageConfigToFields,
} from './config';

describe('github ui config', () => {
  it('round-trips field values through StorageProviderConfig', () => {
    const values = {
      ...EMPTY_GITHUB_VALUES,
      owner: 'octo',
      repo: 'pics',
      token: 'ghp_x',
      private: true,
    };
    expect(storageConfigToFields(fieldsToStorageConfig(values))).toEqual(
      values,
    );
  });

  it('applies defaults and reports incomplete empty config', () => {
    expect(storageConfigToFields({})).toEqual(EMPTY_GITHUB_VALUES);
    expect(isGitHubConfigComplete({})).toBe(false);
  });

  it('merges patches without dropping unrelated fields', () => {
    const current = fieldsToStorageConfig({
      ...EMPTY_GITHUB_VALUES,
      owner: 'octo',
      repo: 'pics',
      token: 'ghp_x',
    });
    expect(
      mergeFieldPatch(current, { branch: 'dev', private: true }),
    ).toMatchObject({
      owner: 'octo',
      repo: 'pics',
      branch: 'dev',
      token: 'ghp_x',
      path: 'images',
      private: true,
    });
  });
});
