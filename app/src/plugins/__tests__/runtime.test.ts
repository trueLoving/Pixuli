import { beforeEach, describe, expect, it } from 'vitest';
import {
  kindRegistry,
  pluginRuntime,
  startPluginRuntime,
  storageRegistry,
} from '../runtime';
import { PLUGIN_RUNTIME_STATE_KEY } from '../localStorageStateStore';

describe('app plugin runtime', () => {
  beforeEach(() => {
    localStorage.removeItem(PLUGIN_RUNTIME_STATE_KEY);
  });

  it('boots builtin github / gitee / pdf', () => {
    startPluginRuntime();
    expect(storageRegistry.getManifest('github')?.id).toBe('github');
    expect(storageRegistry.getManifest('gitee')?.id).toBe('gitee');
    expect(kindRegistry.getManifest('kind.pdf')?.id).toBe('kind.pdf');
    expect(pluginRuntime.getLoadedIds().sort()).toEqual([
      'gitee',
      'github',
      'kind.pdf',
    ]);
  });

  it('setEnabled(false) unregisters from capability registries', async () => {
    startPluginRuntime();
    await pluginRuntime.setEnabled('kind.pdf', false);
    expect(kindRegistry.getManifest('kind.pdf')).toBeUndefined();
    expect(
      pluginRuntime.listStates().find(s => s.id === 'kind.pdf')?.enabled,
    ).toBe(false);

    await pluginRuntime.setEnabled('kind.pdf', true);
    expect(kindRegistry.getManifest('kind.pdf')?.id).toBe('kind.pdf');
  });
});
