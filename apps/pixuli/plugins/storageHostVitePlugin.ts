import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const appRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const monorepoRoot = path.join(appRoot, '../..');
const coreDist = path.join(monorepoRoot, 'packages/core/dist/plugins');
const giteeDist = path.join(
  monorepoRoot,
  'packages/plugin-provider-gitee/dist/proxy',
);

/** dev SSR 默认带 development 条件，回退源码；显式映射到 tsup dist */
const SSR_DIST_REMAP: Record<string, string> = {
  '@pixuli/provider-gitee/proxy/vite': path.join(giteeDist, 'vite.js'),
};

/**
 * Web / 桌面 dev：经 ssrLoadModule 挂载 manifest 声明的 Host 集成（REF-411）。
 * SSR 直载 tsup dist（REF-416）；勿在 vite.config 顶层静态 import @pixuli/core。
 */
export function storageHostVitePlugin(): Plugin {
  return {
    name: 'pixuli-storage-host-integrations',
    async configureServer(server) {
      const [hostMod, registryMod] = await Promise.all([
        server.ssrLoadModule(path.join(coreDist, 'host.js')),
        server.ssrLoadModule(path.join(coreDist, 'registry.js')),
      ]);
      const { registerHostIntegrations } = hostMod as {
        registerHostIntegrations: typeof import('@pixuli/core/plugins/host').registerHostIntegrations;
      };
      const { createStoragePluginRegistry } = registryMod as {
        createStoragePluginRegistry: typeof import('@pixuli/core/plugins/registry').createStoragePluginRegistry;
      };
      const { storageHostManifests } = await server.ssrLoadModule(
        path.join(appRoot, 'src/storage/hostBootstrapManifests.ts'),
      );
      const registry = createStoragePluginRegistry();
      for (const manifest of storageHostManifests) {
        registry.register(manifest, () => ({}) as never);
      }
      const viteDevServer = {
        middlewares: server.middlewares,
        ssrLoadModule: (id: string) =>
          server.ssrLoadModule(SSR_DIST_REMAP[id] ?? id),
      };
      await registerHostIntegrations(registry, {
        target: 'viteDevServer',
        viteDevServer,
      });
    },
  };
}
