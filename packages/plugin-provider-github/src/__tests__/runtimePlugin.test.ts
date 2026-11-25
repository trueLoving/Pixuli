import { describe, expect, it, vi } from 'vitest';
import { createStoragePluginRegistry } from '@pixuli/core/plugins';
import { createKindPluginRegistry } from '@pixuli/core/kinds';
import { createEmptyPluginUiHost } from '@pixuli/core/plugin-runtime';
import { createGitHubRuntimePlugin } from '../runtimePlugin';
import { githubManifest } from '../manifest';

describe('createGitHubRuntimePlugin', () => {
  it('registers and unregisters capability and UI via lifecycle', async () => {
    const storage = createStoragePluginRegistry();
    const kinds = createKindPluginRegistry();
    const ui = createEmptyPluginUiHost();
    const registerFields = vi.spyOn(ui, 'registerConnectionFields');
    const unregisterFields = vi.spyOn(ui, 'unregisterConnectionFields');
    const plugin = createGitHubRuntimePlugin();

    await plugin.onload({ storage, kinds, ui });
    expect(storage.getManifest(githubManifest.id)?.id).toBe('github');
    expect(registerFields).toHaveBeenCalled();

    await plugin.onunload?.();
    expect(storage.getManifest(githubManifest.id)).toBeUndefined();
    expect(unregisterFields).toHaveBeenCalledWith('github');
  });
});
