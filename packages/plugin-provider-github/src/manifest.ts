import type { StoragePluginManifest } from '@pixuli/core/plugins';

export const githubManifest: StoragePluginManifest = {
  id: 'github',
  name: 'GitHub',
  version: '1.0.0',
  icon: 'github',
  capabilities: {
    list: true,
    upload: true,
    delete: true,
    updateMetadata: true,
    sync: true,
    publicUrl: true,
  },
  auth: {
    modes: ['pat'],
    tokenCreateUrl:
      'https://github.com/settings/tokens/new?scopes=repo&description=Pixuli',
    requiredScopes: ['repo'],
  },
};
