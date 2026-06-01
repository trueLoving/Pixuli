import type { StoragePluginManifest } from '@pixuli/core/plugins';

export const giteeManifest: StoragePluginManifest = {
  id: 'gitee',
  name: 'Gitee',
  version: '1.0.0',
  capabilities: {
    list: true,
    upload: true,
    delete: true,
    updateMetadata: true,
    needsProxy: true,
  },
};
