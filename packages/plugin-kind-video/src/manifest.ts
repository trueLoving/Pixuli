import type { KindPluginManifest } from '@pixuli/core/kinds';

export const videoKindManifest: KindPluginManifest = {
  id: 'kind.video',
  name: 'Video',
  version: '0.1.0',
  kind: 'video',
  ingest: {
    accept: {
      'video/*': ['.mp4', '.webm', '.mov', '.mkv', '.avi'],
    },
    preferredSources: ['file', 'gallery'],
  },
  capabilities: {
    preview: true,
    thumbnail: true,
    actions: [],
  },
};
