import { describe, expect, it } from 'vitest';
import {
  EMPTY_GITEE_VALUES,
  fieldsToStorageConfig,
  isGiteeConfigComplete,
  mergeFieldPatch,
  storageConfigToFields,
} from './config';

describe('gitee ui config', () => {
  it('defaults branch to master', () => {
    expect(storageConfigToFields({})).toEqual(EMPTY_GITEE_VALUES);
    expect(EMPTY_GITEE_VALUES.branch).toBe('master');
    expect(isGiteeConfigComplete({})).toBe(false);
  });

  it('merges patches without dropping unrelated fields', () => {
    const current = fieldsToStorageConfig({
      ...EMPTY_GITEE_VALUES,
      owner: 'octo',
      repo: 'pics',
      token: 'gt_x',
    });
    expect(
      mergeFieldPatch(current, { branch: 'dev', private: true }),
    ).toMatchObject({
      owner: 'octo',
      repo: 'pics',
      branch: 'dev',
      token: 'gt_x',
      path: 'images',
      private: true,
    });
  });
});
