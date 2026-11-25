import { describe, expect, it, vi } from 'vitest';
import { createKindPluginRegistry } from '@pixuli/core/kinds';
import { createStoragePluginRegistry } from '@pixuli/core/plugins';
import { createEmptyPluginUiHost } from '@pixuli/core/plugin-runtime';
import { createMarkdownRuntimePlugin } from '../runtimePlugin';
import { markdownKindManifest } from '../manifest';

describe('createMarkdownRuntimePlugin', () => {
  it('registers and unregisters capability and UI via lifecycle', async () => {
    const storage = createStoragePluginRegistry();
    const kinds = createKindPluginRegistry();
    const ui = createEmptyPluginUiHost();
    const registerPreview = vi.spyOn(ui, 'registerPreview');
    const unregisterPreview = vi.spyOn(ui, 'unregisterPreview');
    const plugin = createMarkdownRuntimePlugin();

    await plugin.onload({ storage, kinds, ui });
    expect(kinds.getManifest(markdownKindManifest.id)?.id).toBe(
      'kind.markdown',
    );
    expect(registerPreview).toHaveBeenCalled();

    await plugin.onunload?.();
    expect(kinds.getManifest(markdownKindManifest.id)).toBeUndefined();
    expect(unregisterPreview).toHaveBeenCalledWith('kind.markdown');
  });
});
