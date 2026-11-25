import { describe, expect, it, vi } from 'vitest';
import { createKindPluginRegistry } from '@pixuli/core/kinds';
import { createStoragePluginRegistry } from '@pixuli/core/plugins';
import { createEmptyPluginUiHost } from '@pixuli/core/plugin-runtime';
import { createTextRuntimePlugin } from '../runtimePlugin';
import { textKindManifest } from '../manifest';

describe('createTextRuntimePlugin', () => {
  it('registers and unregisters capability and UI via lifecycle', async () => {
    const storage = createStoragePluginRegistry();
    const kinds = createKindPluginRegistry();
    const ui = createEmptyPluginUiHost();
    const registerPreview = vi.spyOn(ui, 'registerPreview');
    const unregisterPreview = vi.spyOn(ui, 'unregisterPreview');
    const plugin = createTextRuntimePlugin();

    await plugin.onload({ storage, kinds, ui });
    expect(kinds.getManifest(textKindManifest.id)?.id).toBe('kind.text');
    expect(registerPreview).toHaveBeenCalled();

    await plugin.onunload?.();
    expect(kinds.getManifest(textKindManifest.id)).toBeUndefined();
    expect(unregisterPreview).toHaveBeenCalledWith('kind.text');
  });
});
