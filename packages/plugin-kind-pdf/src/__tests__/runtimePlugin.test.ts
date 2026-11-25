import { describe, expect, it, vi } from 'vitest';
import { createKindPluginRegistry } from '@pixuli/core/kinds';
import { createStoragePluginRegistry } from '@pixuli/core/plugins';
import { createEmptyPluginUiHost } from '@pixuli/core/plugin-runtime';
import { createPdfRuntimePlugin } from '../runtimePlugin';
import { pdfKindManifest } from '../manifest';

describe('createPdfRuntimePlugin', () => {
  it('registers and unregisters capability and UI via lifecycle', async () => {
    const storage = createStoragePluginRegistry();
    const kinds = createKindPluginRegistry();
    const ui = createEmptyPluginUiHost();
    const registerPreview = vi.spyOn(ui, 'registerPreview');
    const unregisterPreview = vi.spyOn(ui, 'unregisterPreview');
    const plugin = createPdfRuntimePlugin();

    await plugin.onload({ storage, kinds, ui });
    expect(kinds.getManifest(pdfKindManifest.id)?.id).toBe('kind.pdf');
    expect(registerPreview).toHaveBeenCalled();

    await plugin.onunload?.();
    expect(kinds.getManifest(pdfKindManifest.id)).toBeUndefined();
    expect(unregisterPreview).toHaveBeenCalledWith('kind.pdf');
  });
});
