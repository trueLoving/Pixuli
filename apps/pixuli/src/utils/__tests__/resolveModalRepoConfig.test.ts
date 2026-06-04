import { describe, it, expect } from 'vitest';
import {
  configFieldsKey,
  resolveModalRepoConfig,
} from '../resolveModalRepoConfig';

const userGiteeEntry = {
  id: 'u7whl61m',
  label: 'sakura0922/Media',
  pluginId: 'gitee' as const,
  config: {
    owner: 'sakura0922',
    repo: 'Media',
    token: '098e2ef38c528e7d32ead058ee73b860',
    branch: 'main',
    path: 'images',
  },
  createdAt: 1780535342445,
  updatedAt: 1780535342445,
};

describe('resolveModalRepoConfig (REF-312)', () => {
  it('编辑 Gitee 源时应从 StoredSourceEntry 回显用户 localStorage 配置', () => {
    const config = resolveModalRepoConfig('gitee', {
      isDemoMode: false,
      editingSourceId: 'u7whl61m',
      editingSourcePluginId: 'gitee',
      editingSourceRepoConfig: userGiteeEntry.config,
      editingSource: userGiteeEntry,
      fallbackGithub: null,
      fallbackGitee: null,
    });

    expect(config).toMatchObject({
      owner: 'sakura0922',
      repo: 'Media',
      token: '098e2ef38c528e7d32ead058ee73b860',
      branch: 'main',
      path: 'images',
    });
  });

  it('编辑 GitHub 源时不应返回 Gitee 配置', () => {
    const config = resolveModalRepoConfig('gitee', {
      isDemoMode: false,
      editingSourceId: 'ya8juivd',
      editingSourcePluginId: 'github',
      editingSourceRepoConfig: {
        owner: '1',
        repo: '2',
        branch: 'main',
        token: '3',
        path: 'images',
      },
      editingSource: {
        id: 'ya8juivd',
        label: '1/2',
        pluginId: 'github',
        config: {
          owner: '1',
          repo: '2',
          branch: 'main',
          token: '3',
          path: 'images',
        },
        createdAt: 1,
        updatedAt: 1,
      },
      fallbackGithub: null,
      fallbackGitee: null,
    });

    expect(config).toBeNull();
  });

  it('Demo 模式下编辑已有源仍应回显', () => {
    const config = resolveModalRepoConfig('gitee', {
      isDemoMode: true,
      editingSourceId: 'u7whl61m',
      editingSourcePluginId: 'gitee',
      editingSourceRepoConfig: userGiteeEntry.config,
      editingSource: userGiteeEntry,
      fallbackGithub: null,
      fallbackGitee: null,
    });

    expect(config).toMatchObject({ owner: 'sakura0922', repo: 'Media' });
  });

  it('configFieldsKey 在配置变化时应变化', () => {
    expect(configFieldsKey(null)).toBe('empty');
    expect(
      configFieldsKey({
        owner: 'a',
        repo: 'b',
        branch: 'main',
        token: 't',
        path: 'images',
      }),
    ).not.toBe(
      configFieldsKey({
        owner: 'x',
        repo: 'b',
        branch: 'main',
        token: 't',
        path: 'images',
      }),
    );
  });
});
