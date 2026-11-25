import type { KindPluginManifest } from '@pixuli/core/kinds';

export const textKindManifest: KindPluginManifest = {
  id: 'kind.text',
  name: 'Plain Text',
  version: '0.1.0',
  kind: 'text',
  capabilities: {
    preview: true,
    thumbnail: false,
    actions: [],
  },
};
