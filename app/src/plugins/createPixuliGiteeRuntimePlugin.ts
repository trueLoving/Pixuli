import type { StoragePluginRegistry } from '@pixuli/core/plugins';
import type { PluginUiHost, RuntimePlugin } from '@pixuli/core/plugin-runtime';
import {
  contributeGiteeUi,
  unregisterGiteeUi,
} from '@pixuli/provider-gitee/ui';
import {
  pixuliGiteeManifest,
  registerPixuliGiteeProvider,
} from '@/storage/registerGiteeProvider';

/** Pixuli 特化 Gitee（无 Host 代理）；适配器留在 app */
export function createPixuliGiteeRuntimePlugin(): RuntimePlugin {
  let storage: StoragePluginRegistry | null = null;
  let ui: PluginUiHost | null = null;
  return {
    manifest: {
      id: pixuliGiteeManifest.id,
      name: pixuliGiteeManifest.name,
      version: pixuliGiteeManifest.version,
      origin: 'builtin',
      capabilities: ['storage'],
    },
    onload(api) {
      storage = api.storage;
      ui = api.ui;
      registerPixuliGiteeProvider(api.storage);
      contributeGiteeUi(api.ui);
    },
    onunload() {
      if (ui) unregisterGiteeUi(ui);
      storage?.unregister(pixuliGiteeManifest.id);
      storage = null;
      ui = null;
    },
  };
}
