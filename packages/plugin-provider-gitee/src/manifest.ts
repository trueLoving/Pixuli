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
};
