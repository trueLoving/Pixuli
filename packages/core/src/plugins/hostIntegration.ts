import type {
  HostIntegrationDescriptor,
  HostIntegrationKind,
  StoragePluginManifest,
  StoragePluginRegistry,
} from './types';

export type { HostIntegrationDescriptor, HostIntegrationKind } from './types';

export interface HostIntegrationEntry {
  pluginId: string;
  descriptor: HostIntegrationDescriptor;
}

/** Vite dev server 最小表面（core 不依赖 vite 包） */
export interface ViteDevServerLike {
  middlewares: { use: (handler: unknown) => void };
  ssrLoadModule: (id: string) => Promise<Record<string, unknown>>;
}

export interface VitePluginLike {
  configureServer?: (server: ViteDevServerLike) => void | Promise<void>;
}

export interface ElectronMainHostContext {
  /** 桌面 dev 走 Vite 中间件，打包版由插件自启本地 HTTP */
  isDev: boolean;
  onBeforeQuit: (handler: () => void) => void;
  ipcMain: {
    on: (
      channel: string,
      listener: (event: { returnValue: unknown }) => void,
    ) => void;
  };
}

export interface ElectronPreloadHostContext {
  contextBridge: {
    exposeInMainWorld: (key: string, value: unknown) => void;
  };
  ipcRenderer: {
    sendSync: (channel: string, ...args: unknown[]) => unknown;
  };
}

export type HostBootstrapTarget =
  | 'viteDevServer'
  | 'electronMain'
  | 'electronPreload';

export interface HostBootstrapContext {
  target: HostBootstrapTarget;
  viteDevServer?: ViteDevServerLike;
  electronMain?: ElectronMainHostContext;
  electronPreload?: ElectronPreloadHostContext;
}

export function listHostIntegrations(
  registry: StoragePluginRegistry,
  kind?: HostIntegrationKind,
): HostIntegrationEntry[] {
  const entries: HostIntegrationEntry[] = [];
  for (const manifest of registry.listManifests()) {
    collectFromManifest(manifest, kind, entries);
  }
  return entries;
}

function collectFromManifest(
  manifest: StoragePluginManifest,
  kind: HostIntegrationKind | undefined,
  entries: HostIntegrationEntry[],
): void {
  for (const descriptor of manifest.hostIntegrations ?? []) {
    if (kind === undefined || descriptor.kind === kind) {
      entries.push({ pluginId: manifest.id, descriptor });
    }
  }
}

async function invokeViteDevServerIntegration(
  descriptor: HostIntegrationDescriptor,
  server: ViteDevServerLike,
): Promise<void> {
  const mod = await server.ssrLoadModule(descriptor.module);
  const factory = mod[descriptor.exportName];
  if (typeof factory !== 'function') {
    throw new Error(
      `Host integration export "${descriptor.exportName}" not found in ${descriptor.module}`,
    );
  }
  const result = factory();
  const plugin = result as VitePluginLike;
  const hook = plugin?.configureServer;
  if (typeof hook === 'function') {
    await hook(server);
  }
}

async function invokeElectronMainIntegration(
  descriptor: HostIntegrationDescriptor,
  ctx: ElectronMainHostContext,
): Promise<void> {
  const mod = (await import(/* @vite-ignore */ descriptor.module)) as Record<
    string,
    unknown
  >;
  const setup = mod[descriptor.exportName];
  if (typeof setup !== 'function') {
    throw new Error(
      `Host integration export "${descriptor.exportName}" not found in ${descriptor.module}`,
    );
  }
  await setup(ctx);
}

async function invokeElectronPreloadIntegration(
  descriptor: HostIntegrationDescriptor,
  ctx: ElectronPreloadHostContext,
): Promise<void> {
  const mod = (await import(/* @vite-ignore */ descriptor.module)) as Record<
    string,
    unknown
  >;
  const expose = mod[descriptor.exportName];
  if (typeof expose !== 'function') {
    throw new Error(
      `Host integration export "${descriptor.exportName}" not found in ${descriptor.module}`,
    );
  }
  await expose(ctx);
}

/**
 * 按宿主目标挂载已注册插件声明的 Host 集成（扫描 Registry manifest）。
 */
export async function registerHostIntegrations(
  registry: StoragePluginRegistry,
  hostCtx: HostBootstrapContext,
): Promise<void> {
  const entries = listHostIntegrations(registry, hostCtx.target);

  switch (hostCtx.target) {
    case 'viteDevServer': {
      const server = hostCtx.viteDevServer;
      if (!server) {
        throw new Error(
          'registerHostIntegrations(viteDevServer): missing viteDevServer',
        );
      }
      for (const { descriptor } of entries) {
        await invokeViteDevServerIntegration(descriptor, server);
      }
      break;
    }
    case 'electronMain': {
      const electronMain = hostCtx.electronMain;
      if (!electronMain) {
        throw new Error(
          'registerHostIntegrations(electronMain): missing electronMain',
        );
      }
      for (const { descriptor } of entries) {
        await invokeElectronMainIntegration(descriptor, electronMain);
      }
      break;
    }
    case 'electronPreload': {
      const electronPreload = hostCtx.electronPreload;
      if (!electronPreload) {
        throw new Error(
          'registerHostIntegrations(electronPreload): missing electronPreload',
        );
      }
      for (const { descriptor } of entries) {
        await invokeElectronPreloadIntegration(descriptor, electronPreload);
      }
      break;
    }
    default: {
      const _exhaustive: never = hostCtx.target;
      throw new Error(`Unsupported host bootstrap target: ${_exhaustive}`);
    }
  }
}

/** Vite 插件：在 `configureServer` 中挂载所有 `viteDevServer` 集成 */
export function createStorageHostVitePlugin(registry: StoragePluginRegistry): {
  name: string;
  configureServer: (server: ViteDevServerLike) => Promise<void>;
} {
  return {
    name: 'pixuli-storage-host-integrations',
    async configureServer(server) {
      await registerHostIntegrations(registry, {
        target: 'viteDevServer',
        viteDevServer: server,
      });
    },
  };
}
