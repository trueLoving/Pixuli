import type { KindPluginManifest } from '@pixuli/core/kinds';

export const markdownKindManifest: KindPluginManifest = {
  id: 'kind.markdown',
  name: 'Markdown',
  version: '0.1.0',
  kind: 'markdown',
  ingest: {
    accept: {
      'text/markdown': ['.md', '.markdown'],
      'text/x-markdown': ['.md', '.markdown'],
    },
    preferredSources: ['file'],
  },
  capabilities: {
    preview: true,
    thumbnail: false,
    actions: [],
  },
};
