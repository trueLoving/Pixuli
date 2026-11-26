import type { KindPluginRegistry } from '@pixuli/core/kinds';
import type { PluginUiHost, RuntimePlugin } from '@pixuli/core/plugin-runtime';
import { imageKindManifest } from './manifest';
import { registerImageKind } from './register';
import { contributeImageUi, unregisterImageUi } from './ui/contribute';

export function createImageRuntimePlugin(): RuntimePlugin {
  let kinds: KindPluginRegistry | null = null;
  let ui: PluginUiHost | null = null;
  return {
    manifest: {
      id: imageKindManifest.id,
      name: imageKindManifest.name,
      version: imageKindManifest.version,
      origin: 'builtin',
      capabilities: ['kind'],
    },
    onload(api) {
      kinds = api.kinds;
      ui = api.ui;
      registerImageKind(api.kinds);
      contributeImageUi(api.ui);
    },
    onunload() {
      if (ui) unregisterImageUi(ui);
      kinds?.unregister(imageKindManifest.id);
      kinds = null;
      ui = null;
    },
  };
}
