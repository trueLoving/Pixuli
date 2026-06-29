import { describe, expect, it } from 'vitest';
import {
  createStorageHostVitePlugin,
  listHostIntegrations,
} from '../hostIntegration';
import { createStoragePluginRegistry } from '../registry';
import type { StoragePluginManifest } from '../types';

const giteeLikeManifest: StoragePluginManifest = {
  id: 'gitee',
  name: 'Gitee',
  version: '1.0.0',
  capabilities: {
    list: true,
    upload: true,
    delete: true,
    updateMetadata: true,
    sync: true,
    publicUrl: true,
  },
  hostIntegrations: [
    {
      kind: 'viteDevServer',
      module: 'virtual:gitee-vite-host',
      exportName: 'viteHostPlugin',
    },
    {
      kind: 'electronMain',
      module: 'virtual:gitee-electron-host',
      exportName: 'setupElectronMainHost',
    },
  ],
};

describe('hostIntegration', () => {
  it('listHostIntegrations filters by kind', () => {
    const registry = createStoragePluginRegistry();
    registry.register(giteeLikeManifest, () => ({}) as never);

    expect(listHostIntegrations(registry)).toHaveLength(2);
    expect(listHostIntegrations(registry, 'viteDevServer')).toHaveLength(1);
    expect(listHostIntegrations(registry, 'electronMain')).toHaveLength(1);
    expect(listHostIntegrations(registry, 'serverless')).toHaveLength(0);
  });

  it('createStorageHostVitePlugin invokes viteDevServer integrations', async () => {
    const registry = createStoragePluginRegistry();
    registry.register(
      {
        ...giteeLikeManifest,
        hostIntegrations: [
          {
            kind: 'viteDevServer',
            module: 'virtual:test-vite-host',
            exportName: 'testViteHostPlugin',
          },
        ],
      },
      () => ({}) as never,
    );

    const used: string[] = [];
    const plugin = createStorageHostVitePlugin(registry);
    await plugin.configureServer({
      middlewares: { use: () => used.push('middleware') },
      ssrLoadModule: async id => {
        expect(id).toBe('virtual:test-vite-host');
        return {
          testViteHostPlugin: () => ({
            configureServer: async () => {
              used.push('configureServer');
            },
          }),
        };
      },
    });

    expect(used).toEqual(['configureServer']);
  });
});
