import { describe, expect, it, vi } from 'vitest';
import { createStoragePluginRegistry } from '@pixuli/core/plugins';
import { createKindPluginRegistry } from '@pixuli/core/kinds';
import { createEmptyPluginUiHost } from '@pixuli/core/plugin-runtime';
import { createGiteeRuntimePlugin } from '../runtimePlugin';
import { giteeManifest } from '../manifest';

describe('createGiteeRuntimePlugin', () => {
  it('registers and unregisters capability and UI via lifecycle', async () => {
    const storage = createStoragePluginRegistry();
    const kinds = createKindPluginRegistry();
    const ui = createEmptyPluginUiHost();
    const registerFields = vi.spyOn(ui, 'registerConnectionFields');
    const unregisterFields = vi.spyOn(ui, 'unregisterConnectionFields');
    const plugin = createGiteeRuntimePlugin();

    await plugin.onload({ storage, kinds, ui });
    expect(storage.getManifest(giteeManifest.id)?.id).toBe('gitee');
    expect(registerFields).toHaveBeenCalled();

    await plugin.onunload?.();
    expect(storage.getManifest(giteeManifest.id)).toBeUndefined();
    expect(unregisterFields).toHaveBeenCalledWith('gitee');
  });
});
