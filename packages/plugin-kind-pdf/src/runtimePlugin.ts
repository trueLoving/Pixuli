import type { KindPluginRegistry } from '@pixuli/core/kinds';
import type { RuntimePlugin } from '@pixuli/core/plugin-runtime';
import { pdfKindManifest } from './manifest';
import { registerPdfKind } from './register';

export function createPdfRuntimePlugin(): RuntimePlugin {
  let kinds: KindPluginRegistry | null = null;
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
      registerPdfKind(api.kinds);
    },
    onunload() {
      kinds?.unregister(pdfKindManifest.id);
      kinds = null;
    },
  };
}
