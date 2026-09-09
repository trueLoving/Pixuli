import type { StoragePluginManifest } from '@pixuli/core/plugins';

export const giteeManifest: StoragePluginManifest = {
  id: 'gitee',
  name: 'Gitee',
  version: '1.0.0',
  icon: 'gitee',
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
    tokenCreateUrl: 'https://gitee.com/profile/personal_access_tokens',
    requiredScopes: ['projects'],
  },
};
