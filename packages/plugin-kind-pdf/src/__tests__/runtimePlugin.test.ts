import { describe, expect, it } from 'vitest';
import { createKindPluginRegistry } from '@pixuli/core/kinds';
import { createStoragePluginRegistry } from '@pixuli/core/plugins';
import { createPdfRuntimePlugin } from '../runtimePlugin';
import { pdfKindManifest } from '../manifest';

describe('createPdfRuntimePlugin', () => {
  it('registers and unregisters via lifecycle', async () => {
    const storage = createStoragePluginRegistry();
    const kinds = createKindPluginRegistry();
    const plugin = createPdfRuntimePlugin();

    await plugin.onload({ storage, kinds });
    expect(kinds.getManifest(pdfKindManifest.id)?.id).toBe('kind.pdf');

    await plugin.onunload?.();
    expect(kinds.getManifest(pdfKindManifest.id)).toBeUndefined();
  });
});
