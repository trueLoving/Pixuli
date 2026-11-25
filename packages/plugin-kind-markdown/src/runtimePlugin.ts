import type { KindPluginRegistry } from '@pixuli/core/kinds';
import type { PluginUiHost, RuntimePlugin } from '@pixuli/core/plugin-runtime';
import { markdownKindManifest } from './manifest';
import { registerMarkdownKind } from './register';
import { contributeMarkdownUi, unregisterMarkdownUi } from './ui/contribute';

export function createMarkdownRuntimePlugin(): RuntimePlugin {
  let kinds: KindPluginRegistry | null = null;
  let ui: PluginUiHost | null = null;
  return {
    manifest: {
      id: markdownKindManifest.id,
      name: markdownKindManifest.name,
      version: markdownKindManifest.version,
      origin: 'builtin',
      capabilities: ['kind'],
    },
    onload(api) {
      kinds = api.kinds;
      ui = api.ui;
      registerMarkdownKind(api.kinds);
      const caps = api.ui.getKindCapabilities();
      contributeMarkdownUi(api.ui, {
        readFile: caps.readFile,
        isLocalAvailable: caps.isLocalAvailable,
      });
    },
    onunload() {
      if (ui) unregisterMarkdownUi(ui);
      kinds?.unregister(markdownKindManifest.id);
      kinds = null;
      ui = null;
    },
  };
}
