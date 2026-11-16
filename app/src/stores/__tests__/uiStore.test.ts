import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUIStore } from '../uiStore';
import { useSourceStore } from '@/features/settings/sourceStore';
import { useAssetStore } from '@/features/library/assetStore';

vi.mock('../../storage/registry', async importOriginal => {
  const actual =
    await importOriginal<typeof import('../../storage/registry')>();
  return {
    ...actual,
    isStoragePluginRegistered: () => true,
  };
});

const giteeSource = {
  id: 'gt-edit-1',
  label: 'o/media',
  pluginId: 'gitee' as const,
  config: {
    owner: 'sakura0922',
    repo: 'Media',
    branch: 'main',
    token: 'secret-token',
    path: 'images',
  },
  createdAt: 1,
  updatedAt: 1,
};

describe('uiStore.openConfigModalForEdit (REF-312)', () => {
  beforeEach(() => {
    useUIStore.setState({
      editingSourceId: null,
      editingSourcePluginId: null,
      editingSourceRepoConfig: null,
    });
    useSourceStore.setState({
      sources: [giteeSource],
      selectedSourceId: 'gt-edit-1',
    });
    useAssetStore.setState({
      storageType: 'gitee',
      githubConfig: null,
      giteeConfig: null,
      storageProvider: null,
      assets: [],
      loading: false,
      error: null,
    });
  });

  it('openSettingsModalForAddSource 可预填服务并打开同步向导', () => {
    useUIStore.getState().openSettingsModalForAddSource('github');
    const ui = useUIStore.getState();
    expect(ui.showSettingsModal).toBe(true);
    expect(ui.settingsSection).toBe('sync');
    expect(ui.settingsSyncAddOpen).toBe(true);
    expect(ui.settingsSyncPrefillPluginId).toBe('github');
  });

  it('选中 Gitee 源后编辑应打开设置同步向导并快照 config', () => {
    const ok = useUIStore.getState().openConfigModalForEdit('gt-edit-1');
    expect(ok).toBe(true);

    const ui = useUIStore.getState();
    expect(ui.showSettingsModal).toBe(true);
    expect(ui.settingsSection).toBe('sync');
    expect(ui.editingSourceId).toBe('gt-edit-1');
    expect(ui.editingSourcePluginId).toBe('gitee');
    expect(ui.editingSourceRepoConfig).toMatchObject({
      owner: 'sakura0922',
      repo: 'Media',
      token: 'secret-token',
      path: 'images',
    });

    expect(useAssetStore.getState().storageType).toBe('gitee');
    expect(useAssetStore.getState().giteeConfig?.owner).toBe('sakura0922');
  });
});
