import type { KindPluginManifest } from '@pixuli/core/kinds';

export const imageKindManifest: KindPluginManifest = {
  id: 'kind.image',
  name: 'Image',
  version: '0.1.0',
  kind: 'image',
  capabilities: {
    preview: true,
    thumbnail: true,
    actions: [],
    process: true,
  },
};
