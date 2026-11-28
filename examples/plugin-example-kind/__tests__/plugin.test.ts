import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  createEmptyPluginUiHost,
  createPluginRuntime,
  parseDiskPluginManifest,
} from '@pixuli/core/plugin-runtime';
import { createKindPluginRegistry } from '@pixuli/core/kinds';
import { createStoragePluginRegistry } from '@pixuli/core/plugins';

const pluginDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../plugin',
);

describe('@pixuli/example-kind-plugin', () => {
  it('disk manifest is valid', () => {
    const raw = JSON.parse(
      fs.readFileSync(path.join(pluginDir, 'manifest.json'), 'utf8'),
    );
    const manifest = parseDiskPluginManifest(raw);
    expect(manifest.id).toBe('ext.example-kind');
    expect(manifest.main).toBe('main.mjs');
    expect(manifest.capabilities).toEqual(['kind']);
  });

  it('main.mjs registers kind match and ingest for .example', async () => {
    const kinds = createKindPluginRegistry();
    const runtime = createPluginRuntime({
      storage: createStoragePluginRegistry(),
      kinds,
      ui: createEmptyPluginUiHost(),
    });

    const mod = await import(
      /* @vite-ignore */ pathToFileURL(path.join(pluginDir, 'main.mjs')).href
    );
    runtime.registerExternal(mod.createRuntimePlugin);
    const loaded = await runtime.load('ext.example-kind');
    expect(loaded).toEqual({ id: 'ext.example-kind', ok: true });

    const handler = kinds.matchHandler({ name: 'demo.example' });
    expect(handler?.manifest.id).toBe('ext.example-kind');
    expect(handler?.manifest.ingest?.accept).toBeDefined();
    expect(kinds.matchHandler({ name: 'demo.txt' })).toBeUndefined();

    await runtime.setEnabled('ext.example-kind', false);
    expect(kinds.matchHandler({ name: 'demo.example' })).toBeUndefined();
  });
});
