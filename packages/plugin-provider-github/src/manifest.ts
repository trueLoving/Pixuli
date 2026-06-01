import type { StoragePluginManifest } from '@pixuli/core/plugins';

export const githubManifest: StoragePluginManifest = {
  id: 'github',
  name: 'GitHub',
  version: '1.0.0',
  capabilities: {
    list: true,
    upload: true,
    delete: true,
    updateMetadata: true,
  },
};
