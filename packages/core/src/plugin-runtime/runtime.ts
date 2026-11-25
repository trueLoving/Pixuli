import { MemoryPluginStateStore } from './memoryStateStore';
import type {
  PluginApi,
  PluginLoadResult,
  PluginOrigin,
  PluginRuntime,
  PluginStateRecord,
  PluginStateStore,
  RuntimePlugin,
  RuntimePluginFactory,
} from './types';

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    value != null &&
    typeof value === 'object' &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  );
}

function withOrigin(
  factory: RuntimePluginFactory,
  origin: PluginOrigin,
): RuntimePluginFactory {
  return () => {
    const plugin = factory();
    if (plugin.manifest.origin === origin) return plugin;
    return {
      ...plugin,
      manifest: { ...plugin.manifest, origin },
    };
  };
}

export class DefaultPluginRuntime implements PluginRuntime {
  private readonly factories = new Map<string, RuntimePluginFactory>();
  private readonly manifests = new Map<string, RuntimePlugin['manifest']>();
  private readonly order: string[] = [];
  private readonly loaded = new Map<string, RuntimePlugin>();
  private readonly store: PluginStateStore;
  private readonly api: PluginApi;
  private started = false;

  constructor(api: PluginApi, store?: PluginStateStore) {
    this.api = api;
    this.store = store ?? new MemoryPluginStateStore();
  }

  registerBuiltin(factory: RuntimePluginFactory): void {
    this.registerFactory(withOrigin(factory, 'builtin'), 'builtin');
  }

  registerExternal(factory: RuntimePluginFactory): void {
    this.registerFactory(withOrigin(factory, 'external'), 'external');
  }

  private registerFactory(
    factory: RuntimePluginFactory,
    origin: PluginOrigin,
  ): void {
    const plugin = factory();
    const { id } = plugin.manifest;
    if (this.factories.has(id)) {
      throw new Error(
        origin === 'builtin'
          ? `Builtin plugin already registered: ${id}`
          : `External plugin already registered: ${id}`,
      );
    }
    this.factories.set(id, factory);
    this.manifests.set(id, plugin.manifest);
    this.order.push(id);

    if (!this.store.get(id)) {
      this.store.set({
        id,
        enabled: true,
        origin,
        version: plugin.manifest.version,
      });
    }
  }

  async start(): Promise<PluginLoadResult[]> {
    this.started = true;
    const results: PluginLoadResult[] = [];
    for (const id of this.order) {
      const state = this.store.get(id);
      if (state && !state.enabled) {
        results.push({ id, ok: true });
        continue;
      }
      results.push(await this.load(id));
    }
    return results;
  }

  startSync(): PluginLoadResult[] {
    this.started = true;
    const results: PluginLoadResult[] = [];
    for (const id of this.order) {
      const state = this.store.get(id);
      if (state && !state.enabled) {
        results.push({ id, ok: true });
        continue;
      }
      results.push(this.loadSync(id));
    }
    return results;
  }

  async load(id: string): Promise<PluginLoadResult> {
    if (this.loaded.has(id)) {
      return { id, ok: true };
    }
    const factory = this.factories.get(id);
    if (!factory) {
      return { id, ok: false, error: `Unknown plugin: ${id}` };
    }

    try {
      const plugin = factory();
      await plugin.onload(this.api);
      this.markLoaded(plugin);
      return { id, ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { id, ok: false, error: message };
    }
  }

  private loadSync(id: string): PluginLoadResult {
    if (this.loaded.has(id)) {
      return { id, ok: true };
    }
    const factory = this.factories.get(id);
    if (!factory) {
      return { id, ok: false, error: `Unknown plugin: ${id}` };
    }

    try {
      const plugin = factory();
      const ret = plugin.onload(this.api);
      if (isThenable(ret)) {
        return {
          id,
          ok: false,
          error: 'async onload requires start()',
        };
      }
      this.markLoaded(plugin);
      return { id, ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { id, ok: false, error: message };
    }
  }

  private markLoaded(plugin: RuntimePlugin): void {
    this.loaded.set(plugin.manifest.id, plugin);
    this.store.set({
      id: plugin.manifest.id,
      enabled: true,
      origin: plugin.manifest.origin,
      version: plugin.manifest.version,
    });
  }

  async unload(id: string): Promise<void> {
    const plugin = this.loaded.get(id);
    if (!plugin) return;
    try {
      await plugin.onunload?.();
    } finally {
      this.loaded.delete(id);
    }
  }

  async setEnabled(id: string, enabled: boolean): Promise<void> {
    const manifest = this.manifests.get(id);
    if (!manifest) {
      throw new Error(`Unknown plugin: ${id}`);
    }
    const prev = this.store.get(id);
    this.store.set({
      id,
      enabled,
      origin: manifest.origin,
      version: prev?.version ?? manifest.version,
    });
    if (!enabled) {
      await this.unload(id);
      return;
    }
    // 允许 start 之后 registerExternal 再启停；load 对已加载 id 幂等
    await this.load(id);
  }

  listStates(): PluginStateRecord[] {
    return this.order
      .map(id => this.store.get(id))
      .filter((r): r is PluginStateRecord => r != null);
  }

  getLoadedIds(): string[] {
    return [...this.loaded.keys()];
  }
}

export function createPluginRuntime(
  api: PluginApi,
  store?: PluginStateStore,
): PluginRuntime {
  return new DefaultPluginRuntime(api, store);
}
