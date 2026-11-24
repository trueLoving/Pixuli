import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfigManagement } from '../useConfigManagement';
import { useSourceStore } from '@/features/settings/sourceStore';
import { useAssetStore } from '@/features/library/assetStore';

const githubSource = {
  id: 'gh-1',
  label: 'o/r-gh',
  pluginId: 'github' as const,
  config: {
    owner: 'o',
    repo: 'r-gh',
    branch: 'main',
    token: 'gh-token',
    path: 'images',
  },
  createdAt: 1,
  updatedAt: 1,
};

const giteeSource = {
  id: 'gt-1',
  label: 'o/r-gt',
  pluginId: 'gitee' as const,
  config: {
    owner: 'o',
    repo: 'r-gt',
    branch: 'master',
    token: 'gt-token',
    path: 'pics',
  },
  createdAt: 2,
  updatedAt: 2,
};

describe('useConfigManagement (REF-310)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useSourceStore.setState({
      sources: [githubSource, giteeSource],
      selectedSourceId: 'gt-1',
    });
    useAssetStore.setState({
      storageType: 'gitee',
      storageConfig: { ...giteeSource.config },
      storageProvider: null,
      assets: [],
      loading: false,
      error: null,
      loadAssets: vi.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('编辑非当前选中 GitHub 源保存时应更新 sourceStore 并切换激活会话', () => {
    const { result } = renderHook(() => useConfigManagement());

    act(() => {
      result.current.handleSaveConfig(
        {
          owner: 'o',
          repo: 'r-gh',
          branch: 'dev',
          token: 'gh-token-new',
          path: 'uploads',
        },
        'gh-1',
      );
    });

    const updated = useSourceStore
      .getState()
      .sources.find(s => s.id === 'gh-1');
    expect(updated?.config).toMatchObject({
      branch: 'dev',
      path: 'uploads',
      token: 'gh-token-new',
    });
    expect(useAssetStore.getState().storageType).toBe('github');
    expect(useAssetStore.getState().storageConfig).toMatchObject({
      branch: 'dev',
      path: 'uploads',
    });
  });

  it('清除编辑中的源应从 sourceStore 移除并清空激活会话', () => {
    const { result } = renderHook(() => useConfigManagement());

    act(() => {
      result.current.handleClearConfig('gt-1');
    });

    expect(useSourceStore.getState().sources).toHaveLength(1);
    expect(useSourceStore.getState().sources[0].id).toBe('gh-1');
    expect(useSourceStore.getState().selectedSourceId).toBeNull();
    expect(useAssetStore.getState().storageConfig).toBeNull();
    expect(useAssetStore.getState().storageType).toBeNull();
  });
});
