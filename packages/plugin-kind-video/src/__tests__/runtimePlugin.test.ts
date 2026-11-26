import { describe, expect, it, vi } from 'vitest';
import { createKindPluginRegistry } from '@pixuli/core/kinds';
import { createStoragePluginRegistry } from '@pixuli/core/plugins';
import { createEmptyPluginUiHost } from '@pixuli/core/plugin-runtime';
import { createVideoRuntimePlugin } from '../runtimePlugin';
import { videoKindManifest } from '../manifest';

describe('createVideoRuntimePlugin', () => {
  it('registers and unregisters capability and UI via lifecycle', async () => {
    const storage = createStoragePluginRegistry();
    const kinds = createKindPluginRegistry();
    const ui = createEmptyPluginUiHost();
    const registerPreview = vi.spyOn(ui, 'registerPreview');
    const registerThumbnail = vi.spyOn(ui, 'registerThumbnail');
    const unregisterPreview = vi.spyOn(ui, 'unregisterPreview');
    const plugin = createVideoRuntimePlugin();

    await plugin.onload({ storage, kinds, ui });
    expect(kinds.getManifest(videoKindManifest.id)?.id).toBe('kind.video');
    expect(registerPreview).toHaveBeenCalled();
    expect(registerThumbnail).toHaveBeenCalled();

    await plugin.onunload?.();
    expect(kinds.getManifest(videoKindManifest.id)).toBeUndefined();
    expect(unregisterPreview).toHaveBeenCalledWith('kind.video');
  });
});
