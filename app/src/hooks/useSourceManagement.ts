import {
  getRepoConfigFromSource,
  pluginIdToLegacyType,
} from '@pixuli/core/sources';
import { useCallback, useMemo } from 'react';
import { isStoragePluginRegistered } from '../storage/registry';
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
      const legacyType = pluginIdToLegacyType(source.pluginId);
      return {
        id: source.id,
        name: source.label || `${repo.owner}/${repo.repo}`,
        type: legacyType,
        owner: repo.owner,
        repo: repo.repo,
        path: repo.path,
        active: selectedSourceId === source.id,
        available: isStoragePluginRegistered(source.pluginId),
      };
    });
  }, [sources, selectedSourceId]);

  const handleEditSource = useCallback(
    (sourceId: string) => {
      const source = sources.find(s => s.id === sourceId);
      if (!source) {
        return null;
      }
      if (!isStoragePluginRegistered(source.pluginId)) {
        return null;
      }
      const legacyType = pluginIdToLegacyType(source.pluginId);
      const sourceConfig = getRepoConfigFromSource(source);
      useImageStore.setState({ storageType: legacyType });
      if (legacyType === 'github') {
        setGitHubConfig(sourceConfig);
      } else {
        setGiteeConfig(sourceConfig);
      }
      return sourceId;
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
      if (!source || !isStoragePluginRegistered(source.pluginId)) {
        return;
      }
      setSelectedSourceId(id);
      const sourceConfig = getRepoConfigFromSource(source);
      const legacyType = pluginIdToLegacyType(source.pluginId);
      if (legacyType === 'github') {
        setGitHubConfig(sourceConfig);
      } else {
        setGiteeConfig(sourceConfig);
      }
      loadImages();
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
