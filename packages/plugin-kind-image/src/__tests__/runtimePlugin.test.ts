import { describe, expect, it, vi } from 'vitest';
import { createKindPluginRegistry } from '@pixuli/core/kinds';
import { createStoragePluginRegistry } from '@pixuli/core/plugins';
import { createEmptyPluginUiHost } from '@pixuli/core/plugin-runtime';
import { createImageRuntimePlugin } from '../runtimePlugin';
import { imageKindManifest } from '../manifest';

describe('createImageRuntimePlugin', () => {
  it('registers and unregisters capability and UI via lifecycle', async () => {
    const storage = createStoragePluginRegistry();
    const kinds = createKindPluginRegistry();
    const ui = createEmptyPluginUiHost();
    const registerPreview = vi.spyOn(ui, 'registerPreview');
    const registerThumbnail = vi.spyOn(ui, 'registerThumbnail');
    const registerProcess = vi.spyOn(ui, 'registerProcess');
    const unregisterPreview = vi.spyOn(ui, 'unregisterPreview');
    const unregisterProcess = vi.spyOn(ui, 'unregisterProcess');
    const plugin = createImageRuntimePlugin();

    await plugin.onload({ storage, kinds, ui });
    expect(kinds.getManifest(imageKindManifest.id)?.id).toBe('kind.image');
    expect(registerPreview).toHaveBeenCalled();
    expect(registerThumbnail).toHaveBeenCalled();
    expect(registerProcess).toHaveBeenCalled();

    await plugin.onunload?.();
    expect(kinds.getManifest(imageKindManifest.id)).toBeUndefined();
    expect(unregisterPreview).toHaveBeenCalledWith('kind.image');
    expect(unregisterProcess).toHaveBeenCalledWith('kind.image');
  });
});
