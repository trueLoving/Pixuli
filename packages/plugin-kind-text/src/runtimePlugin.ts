import type { KindPluginRegistry } from '@pixuli/core/kinds';
import type { PluginUiHost, RuntimePlugin } from '@pixuli/core/plugin-runtime';
import { textKindManifest } from './manifest';
import { registerTextKind } from './register';
import { contributeTextUi, unregisterTextUi } from './ui/contribute';

export function createTextRuntimePlugin(): RuntimePlugin {
  let kinds: KindPluginRegistry | null = null;
  let ui: PluginUiHost | null = null;
  return {
    manifest: {
      id: textKindManifest.id,
      name: textKindManifest.name,
      version: textKindManifest.version,
      origin: 'builtin',
      capabilities: ['kind'],
    },
    onload(api) {
      kinds = api.kinds;
      ui = api.ui;
      registerTextKind(api.kinds);
      const caps = api.ui.getKindCapabilities();
      contributeTextUi(api.ui, {
        readFile: caps.readFile,
        isLocalAvailable: caps.isLocalAvailable,
      });
    },
    onunload() {
      if (ui) unregisterTextUi(ui);
      kinds?.unregister(textKindManifest.id);
      kinds = null;
      ui = null;
    },
  };
}
