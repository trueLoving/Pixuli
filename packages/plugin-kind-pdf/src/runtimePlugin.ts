import type { KindPluginRegistry } from '@pixuli/core/kinds';
import type { PluginUiHost, RuntimePlugin } from '@pixuli/core/plugin-runtime';
import { pdfKindManifest } from './manifest';
import { registerPdfKind } from './register';
import { contributePdfUi, unregisterPdfUi } from './ui/contribute';

export function createPdfRuntimePlugin(): RuntimePlugin {
  let kinds: KindPluginRegistry | null = null;
  let ui: PluginUiHost | null = null;
  return {
    manifest: {
      id: pdfKindManifest.id,
      name: pdfKindManifest.name,
      version: pdfKindManifest.version,
      origin: 'builtin',
      capabilities: ['kind'],
    },
    onload(api) {
      kinds = api.kinds;
      ui = api.ui;
      registerPdfKind(api.kinds);
      const caps = api.ui.getKindCapabilities();
      contributePdfUi(api.ui, {
        readFile: caps.readFile,
        isLocalAvailable: caps.isLocalAvailable,
      });
    },
    onunload() {
      if (ui) unregisterPdfUi(ui);
      kinds?.unregister(pdfKindManifest.id);
      kinds = null;
      ui = null;
    },
  };
}
