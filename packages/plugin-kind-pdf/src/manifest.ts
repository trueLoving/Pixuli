import type { KindPluginManifest } from '@pixuli/core/kinds';

export const pdfKindManifest: KindPluginManifest = {
  id: 'kind.pdf',
  name: 'PDF',
  version: '0.1.0',
  kind: 'pdf',
  capabilities: {
    preview: true,
    thumbnail: true,
    actions: [],
  },
};
