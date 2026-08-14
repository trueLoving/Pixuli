import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSourceManagement } from '../useSourceManagement';
import { useSourceStore } from '../../stores/sourceStore';
import { useImageStore } from '../../stores/imageStore';

vi.mock('../../storage/registry', async importOriginal => {
  const actual =
    await importOriginal<typeof import('../../storage/registry')>();
  return {
    ...actual,
    isStoragePluginRegistered: () => true,
    listStoragePluginManifests: () => [],
  };
});

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
    branch: 'main',
    token: 'gt-token',
    path: 'images',
  },
  createdAt: 2,
  updatedAt: 2,
};

describe('useSourceManagement (REF-310 / 编辑逻辑已迁至 uiStore.openConfigModalForEdit)', () => {
  beforeEach(() => {
    useSourceStore.setState({
      sources: [githubSource, giteeSource],
      selectedSourceId: 'gt-1',
    });
    useImageStore.setState({
      storageType: 'gitee',
      githubConfig: githubSource.config,
      giteeConfig: giteeSource.config,
      storageProvider: null,
      images: [],
      loading: false,
      error: null,
    });
  });

  it('编辑非当前选中的 GitHub 源时应切换 storageType 并写入 githubConfig', () => {
    const { result } = renderHook(() => useSourceManagement());

    act(() => {
      const id = result.current.handleEditSource('gh-1');
      expect(id).toBe('gh-1');
    });

    const imageState = useImageStore.getState();
    expect(imageState.storageType).toBe('github');
    expect(imageState.githubConfig).toMatchObject({
      owner: 'o',
      repo: 'r-gh',
      token: 'gh-token',
    });
  });

  it('切换选中源应同步 imageStore 配置（W7）', () => {
    const loadImages = vi.fn().mockResolvedValue(undefined);
    useImageStore.setState({ loadImages });

    const { result } = renderHook(() => useSourceManagement());

    act(() => {
      result.current.handleSourceSelect('gh-1');
    });

    expect(useSourceStore.getState().selectedSourceId).toBe('gh-1');
    expect(useImageStore.getState().storageType).toBe('github');
    expect(useImageStore.getState().githubConfig?.repo).toBe('r-gh');
    expect(loadImages).toHaveBeenCalled();
  });

  it('删除非当前选中源后列表应更新（W15）', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { result } = renderHook(() => useSourceManagement());

    act(() => {
      result.current.handleDeleteSource('gh-1', (key: string) => key);
    });

    expect(useSourceStore.getState().sources).toHaveLength(1);
    expect(useSourceStore.getState().sources[0].id).toBe('gt-1');
    expect(useSourceStore.getState().selectedSourceId).toBe('gt-1');

    confirmSpy.mockRestore();
  });
});
