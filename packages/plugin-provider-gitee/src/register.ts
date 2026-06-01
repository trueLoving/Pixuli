import type { StoragePluginRegistry } from '@pixuli/core/plugins';
import { GiteeStorageProvider } from './giteeStorageProvider';
import { giteeManifest } from './manifest';

export function registerGiteeProvider(registry: StoragePluginRegistry): void {
  registry.register(giteeManifest, ctx => new GiteeStorageProvider(ctx));
}

export { giteeManifest };
