import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfigManagement } from '../useConfigManagement';
import { useSourceStore } from '../../stores/sourceStore';
import { useImageStore } from '../../stores/imageStore';

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
    useImageStore.setState({
      storageType: 'gitee',
      githubConfig: { ...githubSource.config },
      giteeConfig: { ...giteeSource.config },
      storageProvider: null,
      images: [],
      loading: false,
      error: null,
      loadImages: vi.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('编辑非当前选中 GitHub 源保存时应更新 sourceStore 并写入 githubConfig（W6）', () => {
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
    expect(useImageStore.getState().githubConfig).toMatchObject({
      branch: 'dev',
      path: 'uploads',
    });
    expect(useImageStore.getState().giteeConfig?.path).toBe('pics');
  });

  it('清除编辑中的源应从 sourceStore 移除（W16）', () => {
    const { result } = renderHook(() => useConfigManagement());

    act(() => {
      result.current.handleClearConfig('gt-1');
    });

    expect(useSourceStore.getState().sources).toHaveLength(1);
    expect(useSourceStore.getState().sources[0].id).toBe('gh-1');
    expect(useSourceStore.getState().selectedSourceId).toBeNull();
    expect(useImageStore.getState().giteeConfig).toBeNull();
  });
});
