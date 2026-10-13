import type { StoragePluginManifest } from '@pixuli/core/plugins';

export const onedriveManifest: StoragePluginManifest = {
  id: 'onedrive',
  name: 'OneDrive',
  version: '1.0.0',
  icon: 'onedrive',
  capabilities: {
    list: true,
    upload: true,
    delete: true,
    updateMetadata: true,
    sync: true,
  },
  auth: {
    modes: ['oauthBrowser'],
    requiredScopes: ['Files.ReadWrite', 'offline_access', 'User.Read'],
  },
};
