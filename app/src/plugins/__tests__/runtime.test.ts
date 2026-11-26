import { beforeEach, describe, expect, it } from 'vitest';
import {
  kindRegistry,
  pluginRuntime,
  startPluginRuntime,
  storageRegistry,
} from '../runtime';
import { PLUGIN_RUNTIME_STATE_KEY } from '../localStorageStateStore';
import { uiRegistry } from '../uiRegistry';

describe('app plugin runtime', () => {
  beforeEach(() => {
    localStorage.removeItem(PLUGIN_RUNTIME_STATE_KEY);
  });

  it('boots builtin github / gitee / kind plugins with UI contributions', () => {
    startPluginRuntime();
    expect(storageRegistry.getManifest('github')?.id).toBe('github');
    expect(storageRegistry.getManifest('gitee')?.id).toBe('gitee');
    expect(kindRegistry.getManifest('kind.pdf')?.id).toBe('kind.pdf');
    expect(kindRegistry.getManifest('kind.markdown')?.id).toBe('kind.markdown');
    expect(kindRegistry.getManifest('kind.text')?.id).toBe('kind.text');
    expect(kindRegistry.getManifest('kind.video')?.id).toBe('kind.video');
    expect(pluginRuntime.getLoadedIds().sort()).toEqual([
      'gitee',
      'github',
      'kind.markdown',
      'kind.pdf',
      'kind.text',
      'kind.video',
    ]);
    expect(
      uiRegistry.resolvePreview({
        name: 'a.pdf',
        mimeType: 'application/pdf',
        kind: 'pdf',
      })?.id,
    ).toBe('kind.pdf');
    expect(
      uiRegistry.resolvePreview({
        name: 'a.md',
        kind: 'markdown',
      })?.id,
    ).toBe('kind.markdown');
    expect(
      uiRegistry.resolvePreview({
        name: 'a.txt',
        kind: 'text',
      })?.id,
    ).toBe('kind.text');
    expect(
      uiRegistry.resolvePreview({
        name: 'a.mp4',
        kind: 'video',
      })?.id,
    ).toBe('kind.video');
    expect(uiRegistry.resolveConnectionFields('github')?.pluginId).toBe(
      'github',
    );
    expect(uiRegistry.resolveConnectionFields('gitee')?.pluginId).toBe('gitee');
  });

  it('setEnabled(false) unregisters capability and UI together', async () => {
    startPluginRuntime();
    await pluginRuntime.setEnabled('kind.pdf', false);
    expect(kindRegistry.getManifest('kind.pdf')).toBeUndefined();
    expect(
      pluginRuntime.listStates().find(s => s.id === 'kind.pdf')?.enabled,
    ).toBe(false);
    expect(
      uiRegistry.resolvePreview({
        name: 'a.pdf',
        mimeType: 'application/pdf',
        kind: 'pdf',
      })?.id,
    ).toBeUndefined();

    await pluginRuntime.setEnabled('kind.pdf', true);
    expect(kindRegistry.getManifest('kind.pdf')?.id).toBe('kind.pdf');
    expect(
      uiRegistry.resolvePreview({
        name: 'a.pdf',
        mimeType: 'application/pdf',
        kind: 'pdf',
      })?.id,
    ).toBe('kind.pdf');
  });
});
