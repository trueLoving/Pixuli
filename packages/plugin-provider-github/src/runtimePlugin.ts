import type { StoragePluginRegistry } from '@pixuli/core/plugins';
import type { RuntimePlugin } from '@pixuli/core/plugin-runtime';
import { githubManifest } from './manifest';
import { registerGitHubProvider } from './register';

export function createGitHubRuntimePlugin(): RuntimePlugin {
  let storage: StoragePluginRegistry | null = null;
  return {
    manifest: {
      id: githubManifest.id,
      name: githubManifest.name,
      version: githubManifest.version,
      origin: 'builtin',
      capabilities: ['storage'],
    },
    onload(api) {
      storage = api.storage;
      registerGitHubProvider(api.storage);
    },
    onunload() {
      storage?.unregister(githubManifest.id);
      storage = null;
    },
  };
}
