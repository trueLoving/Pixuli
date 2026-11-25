import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  createEmptyPluginUiHost,
  createPluginRuntime,
} from '@pixuli/core/plugin-runtime';
import { createKindPluginRegistry } from '@pixuli/core/kinds';
import { createStoragePluginRegistry } from '@pixuli/core/plugins';
import {
  discoverExternalPlugins,
  loadExternalPluginsFromDisk,
  type ExternalLoaderFs,
} from '../externalLoader';

const fixturesRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../electron/fixtures',
);

function nodeFs(): ExternalLoaderFs {
  return {
    readdir: async dir => fs.readdirSync(dir),
    readText: async filePath => fs.readFileSync(filePath, 'utf8'),
    isDirectory: async filePath => {
      try {
        return fs.statSync(filePath).isDirectory();
      } catch {
        return false;
      }
    },
    join: (...parts) => path.join(...parts),
    toImportUrl: absolutePath => pathToFileURL(absolutePath).href,
  };
}

describe('externalLoader', () => {
  it('discovers fixture plugin from fixtures root', async () => {
    const found = await discoverExternalPlugins(fixturesRoot, nodeFs());
    expect(found.some(p => p.manifest.id === 'ext.sample-kind')).toBe(true);
  });

  it('loads fixture via registerExternal and supports setEnabled', async () => {
    const kinds = createKindPluginRegistry();
    const runtime = createPluginRuntime({
      storage: createStoragePluginRegistry(),
      kinds,
      ui: createEmptyPluginUiHost(),
    });

    const results = await loadExternalPluginsFromDisk(
      runtime,
      fixturesRoot,
      nodeFs(),
      async () =>
        import(
          /* @vite-ignore */ '../../../electron/fixtures/sample-kind-plugin/main.mjs'
        ),
    );

    expect(results).toEqual([{ id: 'ext.sample-kind', ok: true }]);
    expect(runtime.getLoadedIds()).toContain('ext.sample-kind');
    expect(
      runtime.listStates().find(s => s.id === 'ext.sample-kind')?.origin,
    ).toBe('external');
    expect(kinds.matchHandler({ name: 'demo.sample' })?.manifest.id).toBe(
      'ext.sample-kind',
    );

    await runtime.setEnabled('ext.sample-kind', false);
    expect(kinds.getManifest('ext.sample-kind')).toBeUndefined();
    expect(runtime.getLoadedIds()).not.toContain('ext.sample-kind');

    await runtime.setEnabled('ext.sample-kind', true);
    expect(runtime.getLoadedIds()).toContain('ext.sample-kind');
    expect(kinds.getManifest('ext.sample-kind')?.id).toBe('ext.sample-kind');
    expect(kinds.matchHandler({ name: 'demo.sample' })?.manifest.id).toBe(
      'ext.sample-kind',
    );
  });

  it('returns empty when root missing', async () => {
    const found = await discoverExternalPlugins(
      path.join(fixturesRoot, 'no-such-plugins-root'),
      nodeFs(),
    );
    expect(found).toEqual([]);
  });
});
