import type { KindPluginRegistry } from '@pixuli/core/kinds';
import type { PluginUiHost, RuntimePlugin } from '@pixuli/core/plugin-runtime';
import { videoKindManifest } from './manifest';
import { registerVideoKind } from './register';
import { contributeVideoUi, unregisterVideoUi } from './ui/contribute';

export function createVideoRuntimePlugin(): RuntimePlugin {
  let kinds: KindPluginRegistry | null = null;
  let ui: PluginUiHost | null = null;
  return {
    manifest: {
      id: videoKindManifest.id,
      name: videoKindManifest.name,
      version: videoKindManifest.version,
      origin: 'builtin',
      capabilities: ['kind'],
    },
    onload(api) {
      kinds = api.kinds;
      ui = api.ui;
      registerVideoKind(api.kinds);
      contributeVideoUi(api.ui);
    },
    onunload() {
      if (ui) unregisterVideoUi(ui);
      kinds?.unregister(videoKindManifest.id);
      kinds = null;
      ui = null;
    },
  };
}
