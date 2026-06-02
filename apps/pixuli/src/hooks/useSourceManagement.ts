import {
  getRepoConfigFromSource,
  pluginIdToLegacyType,
} from '@pixuli/core/sources';
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

  const selectedSource = useMemo(() => {
    return selectedSourceId
      ? sources.find(s => s.id === selectedSourceId)
      : sources[0] || null;
  }, [sources, selectedSourceId]);

  const sidebarSources = useMemo(() => {
    return sources.map(source => {
      const repo = getRepoConfigFromSource(source);
      return {
        id: source.id,
        name: source.label || `${repo.owner}/${repo.repo}`,
        type: pluginIdToLegacyType(source.pluginId),
        owner: repo.owner,
        repo: repo.repo,
        path: repo.path,
        active: selectedSourceId === source.id,
      };
    });
  }, [sources, selectedSourceId]);

  const handleEditSource = useCallback(
    (sourceId: string) => {
      const source = sources.find(s => s.id === sourceId);
      if (source) {
        const pluginId = pluginIdToLegacyType(source.pluginId);
        const sourceConfig = getRepoConfigFromSource(source);
        useImageStore.setState({ storageType: pluginId });
        if (pluginId === 'github') {
          setGitHubConfig(sourceConfig);
        } else {
          setGiteeConfig(sourceConfig);
        }
        return sourceId;
      }
      return null;
    },
    [sources, setGitHubConfig, setGiteeConfig],
  );

  const handleDeleteSource = useCallback(
    (sourceId: string, t: (key: string) => string) => {
      if (window.confirm(t('sidebar.confirmDeleteSource'))) {
        removeSource(sourceId);
        if (selectedSourceId === sourceId) {
          setSelectedSourceId(null);
        }
      }
    },
    [removeSource, selectedSourceId, setSelectedSourceId],
  );

  const handleSourceSelect = useCallback(
    (id: string) => {
      const source = sources.find(s => s.id === id);
      if (source) {
        setSelectedSourceId(id);
        const sourceConfig = getRepoConfigFromSource(source);
        const pluginId = pluginIdToLegacyType(source.pluginId);
        if (pluginId === 'github') {
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
