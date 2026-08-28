import {
  getRepoConfigFromSource,
  resolveSourceDisplay,
} from '@pixuli/core/sources';
import type { SidebarSourceItem } from '@/features/settings/sidebarSourceTypes';
import { useCallback, useMemo } from 'react';
import { isStoragePluginRegistered } from '@/storage/registry';
import { useImageStore } from '@/features/library/imageStore';
import { useSourceStore } from '@/features/settings/sourceStore';
import { syncSourceEntryToImageStore } from '@/features/settings/syncSourceRepoToImageStore';

/**
 * 源管理相关的 hooks
 */
export function useSourceManagement() {
  const { loadImages } = useImageStore();
  const { sources, selectedSourceId, setSelectedSourceId, removeSource } =
    useSourceStore();

  const selectedSource = useMemo(() => {
    return selectedSourceId
      ? sources.find(s => s.id === selectedSourceId)
      : sources[0] || null;
  }, [sources, selectedSourceId]);

  const sidebarSources = useMemo((): SidebarSourceItem[] => {
    return sources.map(source => {
      const repo = getRepoConfigFromSource(source);
      const { legacyType } = resolveSourceDisplay(source.pluginId);
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
      syncSourceEntryToImageStore(source);
      return sourceId;
    },
    [sources],
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
      syncSourceEntryToImageStore(source);
      loadImages();
    },
    [sources, setSelectedSourceId, loadImages],
  );

  return {
    selectedSource,
    sidebarSources,
    handleEditSource,
    handleDeleteSource,
    handleSourceSelect,
  };
}
