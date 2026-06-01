import type { StoragePluginRegistry } from '@pixuli/core/plugins';
import { GitHubStorageProvider } from './githubStorageProvider';
import { githubManifest } from './manifest';

export function registerGitHubProvider(registry: StoragePluginRegistry): void {
  registry.register(githubManifest, ctx => new GitHubStorageProvider(ctx));
}

export { githubManifest };
