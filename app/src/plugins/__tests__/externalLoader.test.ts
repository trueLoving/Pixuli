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

/** examples/plugin-example-kind：子目录 `plugin/` 含可安装产物 */
const examplesPluginRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../examples/plugin-example-kind',
);

const exampleMain = path.join(examplesPluginRoot, 'plugin', 'main.mjs');

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
  it('discovers example plugin from examples root', async () => {
    const found = await discoverExternalPlugins(examplesPluginRoot, nodeFs());
    expect(found.some(p => p.manifest.id === 'ext.example-kind')).toBe(true);
  });

  it('loads example via registerExternal and supports setEnabled', async () => {
    const kinds = createKindPluginRegistry();
    const runtime = createPluginRuntime({
      storage: createStoragePluginRegistry(),
      kinds,
      ui: createEmptyPluginUiHost(),
    });

    const results = await loadExternalPluginsFromDisk(
      runtime,
      examplesPluginRoot,
      nodeFs(),
      async () => import(/* @vite-ignore */ pathToFileURL(exampleMain).href),
    );

    expect(results).toEqual([{ id: 'ext.example-kind', ok: true }]);
    expect(runtime.getLoadedIds()).toContain('ext.example-kind');
    expect(
      runtime.listStates().find(s => s.id === 'ext.example-kind')?.origin,
    ).toBe('external');
    expect(kinds.matchHandler({ name: 'demo.example' })?.manifest.id).toBe(
      'ext.example-kind',
    );

    await runtime.setEnabled('ext.example-kind', false);
    expect(kinds.getManifest('ext.example-kind')).toBeUndefined();
    expect(runtime.getLoadedIds()).not.toContain('ext.example-kind');

    await runtime.setEnabled('ext.example-kind', true);
    expect(runtime.getLoadedIds()).toContain('ext.example-kind');
    expect(kinds.getManifest('ext.example-kind')?.id).toBe('ext.example-kind');
    expect(kinds.matchHandler({ name: 'demo.example' })?.manifest.id).toBe(
      'ext.example-kind',
    );
  });

  it('returns empty when root missing', async () => {
    const found = await discoverExternalPlugins(
      path.join(examplesPluginRoot, 'no-such-plugins-root'),
      nodeFs(),
    );
    expect(found).toEqual([]);
  });
});
