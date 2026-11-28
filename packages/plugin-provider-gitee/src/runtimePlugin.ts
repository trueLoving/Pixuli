import type { StoragePluginRegistry } from '@pixuli/core/plugins';
import type { PluginUiHost, RuntimePlugin } from '@pixuli/core/plugin-runtime';
import { giteeManifest } from './manifest';
import { registerGiteeProvider } from './register';
import { contributeGiteeUi, unregisterGiteeUi } from './ui/contribute';

export function createGiteeRuntimePlugin(): RuntimePlugin {
  let storage: StoragePluginRegistry | null = null;
  let ui: PluginUiHost | null = null;
  return {
    manifest: {
      id: giteeManifest.id,
      name: giteeManifest.name,
      version: giteeManifest.version,
      origin: 'builtin',
      capabilities: ['storage'],
    },
    onload(api) {
      storage = api.storage;
      ui = api.ui;
      registerGiteeProvider(api.storage);
      contributeGiteeUi(api.ui);
    },
    onunload() {
      if (ui) unregisterGiteeUi(ui);
      storage?.unregister(giteeManifest.id);
      storage = null;
      ui = null;
    },
  };
}
