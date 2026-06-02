import {
  getRepoConfigFromSource,
  type StoredSourceEntry,
} from '@pixuli/core/sources';
import { useEffect, useRef } from 'react';
import { useImageStore } from '../stores/imageStore';

/**
 * 同步选中源到 store 的配置
 */
export function useSelectedSourceSync(
  selectedSource: StoredSourceEntry | null,
  onConfigSynced?: () => void,
) {
  const { setGitHubConfig, setGiteeConfig } = useImageStore();
  const lastSyncedSourceIdRef = useRef<string | null>(null);
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    if (selectedSource) {
      if (
        lastSyncedSourceIdRef.current === selectedSource.id &&
        !isInitialMountRef.current
      ) {
        return;
      }

      const sourceConfig = getRepoConfigFromSource(selectedSource);
      if (selectedSource.pluginId === 'github') {
        setGitHubConfig(sourceConfig);
        useImageStore.setState({ storageType: 'github' });
      } else {
        setGiteeConfig(sourceConfig);
        useImageStore.setState({ storageType: 'gitee' });
      }

      lastSyncedSourceIdRef.current = selectedSource.id;
      isInitialMountRef.current = false;

      if (onConfigSynced) {
        setTimeout(() => {
          const { storageProvider, initializeStorage } =
            useImageStore.getState();
          if (!storageProvider) {
            initializeStorage();
          }
          onConfigSynced();
        }, 100);
      }
    }
  }, [selectedSource, setGitHubConfig, setGiteeConfig, onConfigSynced]);
}
