import { describe, expect, it } from 'vitest';
import { importPluginModuleFromSource } from '../importPluginModuleFromSource';

describe('importPluginModuleFromSource', () => {
  it('imports ESM factory from source text', async () => {
    const source = `
      export function createRuntimePlugin() {
        return {
          manifest: {
            id: 'ext.from-blob',
            name: 'Blob',
            version: '0.0.1',
            origin: 'external',
            capabilities: ['kind'],
          },
          onload() {},
          onunload() {},
        };
      }
    `;
    const mod = (await importPluginModuleFromSource(source)) as {
      createRuntimePlugin: () => { manifest: { id: string } };
    };
    expect(typeof mod.createRuntimePlugin).toBe('function');
    expect(mod.createRuntimePlugin().manifest.id).toBe('ext.from-blob');
  });
});
