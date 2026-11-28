import { describe, expect, it, vi } from 'vitest';
import { createKindPluginRegistry } from '../../kinds';
import { createStoragePluginRegistry } from '../../plugins';
import { MemoryPluginStateStore } from '../memoryStateStore';
import { createPluginRuntime } from '../runtime';
import type { RuntimePlugin, RuntimePluginManifest } from '../types';
import { createEmptyPluginUiHost } from '../uiHost';

function api() {
  return {
    storage: createStoragePluginRegistry(),
    kinds: createKindPluginRegistry(),
    ui: createEmptyPluginUiHost(),
  };
}

function makePlugin(
  partial: Partial<RuntimePluginManifest> & Pick<RuntimePluginManifest, 'id'>,
  hooks?: {
    onload?: RuntimePlugin['onload'];
    onunload?: RuntimePlugin['onunload'];
  },
): RuntimePlugin {
  const manifest: RuntimePluginManifest = {
    name: partial.name ?? partial.id,
    version: partial.version ?? '1.0.0',
    origin: 'builtin',
    capabilities: partial.capabilities ?? ['storage'],
    ...partial,
  };
  return {
    manifest,
    onload: hooks?.onload ?? (async () => undefined),
    onunload: hooks?.onunload,
  };
}

describe('PluginRuntime', () => {
  it('loads enabled builtins on start and supports unload / setEnabled', async () => {
    const storage = createStoragePluginRegistry();
    const kinds = createKindPluginRegistry();
    const runtime = createPluginRuntime({
      storage,
      kinds,
      ui: createEmptyPluginUiHost(),
    });

    const onloadA = vi.fn(async apiArg => {
      apiArg.storage.register(
        {
          id: 'a',
          name: 'A',
          version: '1',
          capabilities: {
            list: true,
            upload: true,
            delete: true,
            updateMetadata: true,
          },
        },
        () => ({}) as never,
      );
    });
    const onunloadA = vi.fn(async () => {
      storage.unregister('a');
    });

    runtime.registerBuiltin(() =>
      makePlugin(
        { id: 'a', capabilities: ['storage'] },
        {
          onload: onloadA,
          onunload: onunloadA,
        },
      ),
    );
    runtime.registerBuiltin(() =>
      makePlugin({ id: 'b', capabilities: ['kind'] }),
    );

    const results = await runtime.start();
    expect(results.every(r => r.ok)).toBe(true);
    expect(runtime.getLoadedIds().sort()).toEqual(['a', 'b']);
    expect(storage.getManifest('a')?.id).toBe('a');

    await runtime.setEnabled('a', false);
    expect(onunloadA).toHaveBeenCalled();
    expect(runtime.getLoadedIds()).toEqual(['b']);
    expect(storage.getManifest('a')).toBeUndefined();
    expect(runtime.listStates().find(s => s.id === 'a')?.enabled).toBe(false);

    await runtime.setEnabled('a', true);
    expect(onloadA).toHaveBeenCalledTimes(2);
    expect(storage.getManifest('a')?.id).toBe('a');
  });

  it('registerExternal forces origin external and supports enable cycle', async () => {
    const kinds = createKindPluginRegistry();
    const ui = createEmptyPluginUiHost();
    const runtime = createPluginRuntime({
      storage: createStoragePluginRegistry(),
      kinds,
      ui,
    });

    const onload = vi.fn(apiArg => {
      apiArg.kinds.register(
        {
          id: 'ext.sample',
          name: 'Sample',
          version: '0.1.0',
          match: () => false,
        },
        () => ({}) as never,
      );
      apiArg.ui.registerPreview({
        id: 'ext.sample',
        match: () => false,
        component: {},
      });
    });
    const onunload = vi.fn(() => {
      kinds.unregister('ext.sample');
      ui.unregisterPreview('ext.sample');
    });

    runtime.registerExternal(() =>
      makePlugin(
        {
          id: 'ext.sample',
          origin: 'builtin',
          capabilities: ['kind'],
        },
        { onload, onunload },
      ),
    );

    const results = await runtime.start();
    expect(results[0]?.ok).toBe(true);
    expect(runtime.listStates().find(s => s.id === 'ext.sample')?.origin).toBe(
      'external',
    );
    expect(onload).toHaveBeenCalled();

    await runtime.setEnabled('ext.sample', false);
    expect(onunload).toHaveBeenCalled();
    expect(runtime.getLoadedIds()).toEqual([]);

    await runtime.setEnabled('ext.sample', true);
    expect(onload).toHaveBeenCalledTimes(2);
  });

  it('throws when registering duplicate external id', () => {
    const runtime = createPluginRuntime(api());
    runtime.registerExternal(() => makePlugin({ id: 'dup' }));
    expect(() =>
      runtime.registerExternal(() => makePlugin({ id: 'dup' })),
    ).toThrow(/External plugin already registered/);
  });

  it('unregisterExternal unloads, removes state, and rejects builtin', async () => {
    const kinds = createKindPluginRegistry();
    const store = new MemoryPluginStateStore();
    const runtime = createPluginRuntime(
      {
        storage: createStoragePluginRegistry(),
        kinds,
        ui: createEmptyPluginUiHost(),
      },
      store,
    );

    const onunload = vi.fn(() => {
      kinds.unregister('ext.gone');
    });
    runtime.registerExternal(() =>
      makePlugin(
        {
          id: 'ext.gone',
          capabilities: ['kind'],
        },
        {
          onload(apiArg) {
            apiArg.kinds.register(
              {
                id: 'ext.gone',
                name: 'Gone',
                version: '0.1.0',
                match: () => false,
              },
              () => ({}) as never,
            );
          },
          onunload,
        },
      ),
    );
    runtime.registerBuiltin(() => makePlugin({ id: 'builtin.keep' }));

    await runtime.start();
    expect(runtime.getLoadedIds()).toContain('ext.gone');

    await runtime.unregisterExternal('ext.gone');
    expect(onunload).toHaveBeenCalled();
    expect(runtime.getManifest('ext.gone')).toBeUndefined();
    expect(runtime.listStates().some(s => s.id === 'ext.gone')).toBe(false);
    expect(store.get('ext.gone')).toBeUndefined();
    expect(runtime.getLoadedIds()).not.toContain('ext.gone');

    // 可再次注册同 id
    runtime.registerExternal(() => makePlugin({ id: 'ext.gone' }));
    expect(runtime.getManifest('ext.gone')?.origin).toBe('external');

    await expect(runtime.unregisterExternal('builtin.keep')).rejects.toThrow(
      /Cannot unregister builtin/,
    );
  });

  it('getManifest returns registered manifest', () => {
    const runtime = createPluginRuntime(api());
    runtime.registerBuiltin(() =>
      makePlugin({
        id: 'named',
        name: 'Named Plugin',
        version: '1.2.3',
        capabilities: ['kind'],
      }),
    );
    expect(runtime.getManifest('named')?.name).toBe('Named Plugin');
    expect(runtime.getManifest('missing')).toBeUndefined();
  });

  it('setEnabled throws for unknown id', async () => {
    const runtime = createPluginRuntime(api());
    await expect(runtime.setEnabled('missing', false)).rejects.toThrow(
      /Unknown plugin/,
    );
  });

  it('isolates onload failures', async () => {
    const runtime = createPluginRuntime(api());

    runtime.registerBuiltin(() =>
      makePlugin(
        { id: 'bad' },
        {
          onload: async () => {
            throw new Error('boom');
          },
        },
      ),
    );
    runtime.registerBuiltin(() => makePlugin({ id: 'good' }));

    const results = await runtime.start();
    expect(results.find(r => r.id === 'bad')).toEqual({
      id: 'bad',
      ok: false,
      error: 'boom',
    });
    expect(results.find(r => r.id === 'good')?.ok).toBe(true);
    expect(runtime.getLoadedIds()).toEqual(['good']);
  });

  it('startSync loads sync onloads in the same tick', () => {
    const storage = createStoragePluginRegistry();
    const runtime = createPluginRuntime({
      storage,
      kinds: createKindPluginRegistry(),
      ui: createEmptyPluginUiHost(),
    });
    runtime.registerBuiltin(() =>
      makePlugin(
        { id: 'sync' },
        {
          onload(apiArg) {
            apiArg.storage.register(
              {
                id: 'sync',
                name: 'Sync',
                version: '1',
                capabilities: {
                  list: true,
                  upload: true,
                  delete: true,
                  updateMetadata: true,
                },
              },
              () => ({}) as never,
            );
          },
        },
      ),
    );
    const results = runtime.startSync();
    expect(results[0]?.ok).toBe(true);
    expect(storage.getManifest('sync')?.id).toBe('sync');
  });

  it('skips disabled plugins from store on start', async () => {
    const store = new MemoryPluginStateStore();
    store.set({
      id: 'off',
      enabled: false,
      origin: 'builtin',
      version: '1.0.0',
    });
    const onload = vi.fn();
    const runtime = createPluginRuntime(api(), store);
    runtime.registerBuiltin(() => makePlugin({ id: 'off' }, { onload }));

    await runtime.start();
    expect(onload).not.toHaveBeenCalled();
    expect(runtime.getLoadedIds()).toEqual([]);
  });
});
