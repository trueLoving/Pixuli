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

  it('getRawUrl 返回 Gitee 公网 raw 直链', () => {
    const registry = createStoragePluginRegistry();
    registerGiteeProvider(registry);
    const provider = registry.create('gitee', {
      platform: 'desktop',
      platformAdapter: {} as never,
    });
    provider.configure({
      owner: 'o',
      repo: 'r',
      branch: 'main',
      token: 't',
      path: 'images',
    });
    expect(provider.getRawUrl('a.png')).toBe(
      'https://gitee.com/o/r/raw/main/images/a.png',
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
