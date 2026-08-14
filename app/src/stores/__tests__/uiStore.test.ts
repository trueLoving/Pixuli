import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUIStore } from '../uiStore';
import { useSourceStore } from '../sourceStore';
import { useImageStore } from '../imageStore';

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
      showConfigModal: false,
      editingSourceId: null,
      editingSourcePluginId: null,
      editingSourceRepoConfig: null,
    });
    useSourceStore.setState({
      sources: [giteeSource],
      selectedSourceId: 'gt-edit-1',
    });
    useImageStore.setState({
      storageType: 'gitee',
      githubConfig: null,
      giteeConfig: null,
      storageProvider: null,
      images: [],
      loading: false,
      error: null,
    });
  });

  it('选中 Gitee 源后编辑应快照 StoredSourceEntry.config 到弹窗状态', () => {
    const ok = useUIStore.getState().openConfigModalForEdit('gt-edit-1');
    expect(ok).toBe(true);

    const ui = useUIStore.getState();
    expect(ui.showConfigModal).toBe(true);
    expect(ui.editingSourceId).toBe('gt-edit-1');
    expect(ui.editingSourcePluginId).toBe('gitee');
    expect(ui.editingSourceRepoConfig).toMatchObject({
      owner: 'sakura0922',
      repo: 'Media',
      token: 'secret-token',
      path: 'images',
    });

    expect(useImageStore.getState().storageType).toBe('gitee');
    expect(useImageStore.getState().giteeConfig?.owner).toBe('sakura0922');
  });
});
