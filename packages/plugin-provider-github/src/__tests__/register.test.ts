import { describe, expect, it } from 'vitest';
import { createStoragePluginRegistry } from '@pixuli/core/plugins';
import { registerGitHubProvider, githubManifest } from '../register';
import { GitHubStorageProvider } from '../githubStorageProvider';

describe('registerGitHubProvider', () => {
  it('registers github manifest and creates provider', () => {
    const registry = createStoragePluginRegistry();
    registerGitHubProvider(registry);

    expect(registry.listManifests()).toEqual([githubManifest]);
    const provider = registry.create('github', {
      platform: 'web',
      platformAdapter: {} as never,
    });
    expect(provider).toBeInstanceOf(GitHubStorageProvider);
    expect(provider.manifest.id).toBe('github');
  });

  it('throws when registering github twice', () => {
    const registry = createStoragePluginRegistry();
    registerGitHubProvider(registry);
    expect(() => registerGitHubProvider(registry)).toThrow(
      'Storage plugin already registered: github',
    );
  });
});
