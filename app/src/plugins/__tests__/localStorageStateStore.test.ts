import { beforeEach, describe, expect, it } from 'vitest';
import {
  LocalStoragePluginStateStore,
  PLUGIN_RUNTIME_STATE_KEY,
} from '../localStorageStateStore';

describe('LocalStoragePluginStateStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and restores external origin records', () => {
    const store = new LocalStoragePluginStateStore();
    store.set({
      id: 'ext.sample-kind',
      enabled: false,
      origin: 'external',
      version: '0.1.0',
    });

    const raw = localStorage.getItem(PLUGIN_RUNTIME_STATE_KEY);
    expect(raw).toContain('ext.sample-kind');

    const reloaded = new LocalStoragePluginStateStore();
    expect(reloaded.get('ext.sample-kind')).toEqual({
      id: 'ext.sample-kind',
      enabled: false,
      origin: 'external',
      version: '0.1.0',
    });
  });
});
