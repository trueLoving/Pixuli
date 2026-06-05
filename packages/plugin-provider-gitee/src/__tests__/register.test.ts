import { describe, expect, it } from 'vitest';
import { createStoragePluginRegistry } from '@pixuli/core/plugins';
import { registerGiteeProvider, giteeManifest } from '../register';
import { GiteeStorageProvider } from '../giteeStorageProvider';

describe('registerGiteeProvider', () => {
  it('registers gitee manifest and creates provider', () => {
    const registry = createStoragePluginRegistry();
    registerGiteeProvider(registry);

    expect(registry.listManifests()).toEqual([giteeManifest]);
    const provider = registry.create('gitee', {
      platform: 'web',
      platformAdapter: {} as never,
    });
    expect(provider).toBeInstanceOf(GiteeStorageProvider);
    expect(provider.manifest.id).toBe('gitee');
  });

  it('desktop 平台启用 Gitee 图片代理', () => {
    const registry = createStoragePluginRegistry();
    registerGiteeProvider(registry);
    const provider = registry.create('gitee', {
      platform: 'desktop',
      platformAdapter: {} as never,
      giteeProxyBase: 'http://127.0.0.1:39281',
    });
    provider.configure({
      owner: 'o',
      repo: 'r',
      branch: 'main',
      token: 't',
      path: 'images',
    });
    expect(provider.getRawUrl('a.png')).toBe(
      'http://127.0.0.1:39281/api/gitee-proxy/o/r/raw/main/images/a.png',
    );
  });

  it('throws when registering gitee twice', () => {
    const registry = createStoragePluginRegistry();
    registerGiteeProvider(registry);
    expect(() => registerGiteeProvider(registry)).toThrow(
      'Storage plugin already registered: gitee',
    );
  });
});
