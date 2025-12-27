import { useCallback, useMemo } from 'react';
import { useImageStore } from '../stores/imageStore';
import { useSourceStore } from '../stores/sourceStore';

/**
 * 源管理相关的 hooks
 */
export function useSourceManagement() {
  const { setGitHubConfig, setGiteeConfig, loadImages } = useImageStore();
  const { sources, selectedSourceId, setSelectedSourceId, removeSource } =
    useSourceStore();

  // 获取当前选中的源
  const selectedSource = useMemo(() => {
    return selectedSourceId
      ? sources.find(s => s.id === selectedSourceId)
      : sources[0] || null;
  }, [sources, selectedSourceId]);

  // 构建仓库源列表（用于侧边栏）
  const sidebarSources = useMemo(() => {
    return sources.map(source => ({
      id: source.id,
      name: source.name || `${source.owner}/${source.repo}`,
      type: source.type,
      owner: source.owner,
      repo: source.repo,
      path: source.path,
      active: selectedSourceId === source.id,
    }));
  }, [sources, selectedSourceId]);

  // 处理编辑仓库源
  const handleEditSource = useCallback(
    (sourceId: string) => {
      const source = sources.find(s => s.id === sourceId);
      if (source) {
        // 设置存储类型
        useImageStore.setState({ storageType: source.type });
        // 设置配置
        if (source.type === 'github') {
          setGitHubConfig({
            owner: source.owner,
            repo: source.repo,
            branch: source.branch,
            token: source.token,
            path: source.path,
          });
        } else {
          setGiteeConfig({
            owner: source.owner,
            repo: source.repo,
            branch: source.branch,
            token: source.token,
            path: source.path,
          });
        }
        return sourceId;
      }
      return null;
    },
    [sources, setGitHubConfig, setGiteeConfig],
  );

  // 处理删除仓库源
  const handleDeleteSource = useCallback(
    (sourceId: string, t: (key: string) => string) => {
      // 确认删除
      if (window.confirm(t('sidebar.confirmDeleteSource'))) {
        removeSource(sourceId);
        // 如果删除的是当前选中的源，清除选中状态
        if (selectedSourceId === sourceId) {
          setSelectedSourceId(null);
        }
      }
    },
    [removeSource, selectedSourceId, setSelectedSourceId],
  );

  // 处理源选择
  const handleSourceSelect = useCallback(
    (id: string) => {
      const source = sources.find(s => s.id === id);
      if (source) {
        setSelectedSourceId(id);
        const sourceConfig = {
          owner: source.owner,
          repo: source.repo,
          branch: source.branch,
          token: source.token,
          path: source.path,
        };
        if (source.type === 'github') {
          setGitHubConfig(sourceConfig);
        } else {
          setGiteeConfig(sourceConfig);
        }
        loadImages();
      }
    },
    [sources, setSelectedSourceId, setGitHubConfig, setGiteeConfig, loadImages],
  );

  return {
    selectedSource,
    sidebarSources,
    handleEditSource,
    handleDeleteSource,
    handleSourceSelect,
  };
}
