import type { StoragePluginRegistry } from '@pixuli/core/plugins';
import type { PluginUiHost, RuntimePlugin } from '@pixuli/core/plugin-runtime';
import { githubManifest } from './manifest';
import { registerGitHubProvider } from './register';
import { contributeGitHubUi, unregisterGitHubUi } from './ui/contribute';

export function createGitHubRuntimePlugin(): RuntimePlugin {
  let storage: StoragePluginRegistry | null = null;
  let ui: PluginUiHost | null = null;
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
      ui = api.ui;
      registerGitHubProvider(api.storage);
      contributeGitHubUi(api.ui);
    },
    onunload() {
      if (ui) unregisterGitHubUi(ui);
      storage?.unregister(githubManifest.id);
      storage = null;
      ui = null;
    },
  };
}
