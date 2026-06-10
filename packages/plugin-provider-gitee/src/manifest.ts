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
    needsProxy: true,
  },
  hostIntegrations: [
    {
      kind: 'viteDevServer',
      module: '@pixuli/provider-gitee/proxy/vite',
      exportName: 'viteGiteeProxyPlugin',
    },
    {
      kind: 'electronMain',
      module: '@pixuli/provider-gitee/host/electron',
      exportName: 'setupGiteeElectronMainHost',
    },
    {
      kind: 'electronPreload',
      module: '@pixuli/provider-gitee/host/electron',
      exportName: 'exposeGiteeElectronPreload',
    },
    {
      kind: 'serverless',
      module: '@pixuli/provider-gitee/proxy/server',
      exportName: 'handleGiteeImageProxy',
    },
  ],
};
