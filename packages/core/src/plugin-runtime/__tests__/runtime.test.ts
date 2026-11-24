import { describe, expect, it, vi } from 'vitest';
import { createKindPluginRegistry } from '../../kinds';
import { createStoragePluginRegistry } from '../../plugins';
import { MemoryPluginStateStore } from '../memoryStateStore';
import { createPluginRuntime } from '../runtime';
import type { RuntimePlugin, RuntimePluginManifest } from '../types';

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
    const runtime = createPluginRuntime({ storage, kinds });

    const onloadA = vi.fn(async api => {
      api.storage.register(
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

  it('isolates onload failures', async () => {
    const runtime = createPluginRuntime({
      storage: createStoragePluginRegistry(),
      kinds: createKindPluginRegistry(),
    });

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
    });
    runtime.registerBuiltin(() =>
      makePlugin(
        { id: 'sync' },
        {
          onload(api) {
            api.storage.register(
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
    const runtime = createPluginRuntime(
      {
        storage: createStoragePluginRegistry(),
        kinds: createKindPluginRegistry(),
      },
      store,
    );
    runtime.registerBuiltin(() => makePlugin({ id: 'off' }, { onload }));

    await runtime.start();
    expect(onload).not.toHaveBeenCalled();
    expect(runtime.getLoadedIds()).toEqual([]);
  });
});
