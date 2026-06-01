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

  it('throws when registering gitee twice', () => {
    const registry = createStoragePluginRegistry();
    registerGiteeProvider(registry);
    expect(() => registerGiteeProvider(registry)).toThrow(
      'Storage plugin already registered: gitee',
    );
  });
});
