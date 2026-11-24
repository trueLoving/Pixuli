import { describe, expect, it } from 'vitest';
import { createStoragePluginRegistry } from '@pixuli/core/plugins';
import { createKindPluginRegistry } from '@pixuli/core/kinds';
import { createGitHubRuntimePlugin } from '../runtimePlugin';
import { githubManifest } from '../manifest';

describe('createGitHubRuntimePlugin', () => {
  it('registers and unregisters via lifecycle', async () => {
    const storage = createStoragePluginRegistry();
    const kinds = createKindPluginRegistry();
    const plugin = createGitHubRuntimePlugin();

    await plugin.onload({ storage, kinds });
    expect(storage.getManifest(githubManifest.id)?.id).toBe('github');

    await plugin.onunload?.();
    expect(storage.getManifest(githubManifest.id)).toBeUndefined();
  });
});
