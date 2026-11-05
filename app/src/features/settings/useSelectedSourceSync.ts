import {
  getRepoConfigFromSource,
  type StoredSourceEntry,
} from '@pixuli/core/sources';
import { useEffect, useRef } from 'react';
import { getSourceSelectionPort } from '@/features/library/sourceSelectionPort';
import { useSourceSelection } from '@/features/library/useSourceSelection';
import { useUIStore } from '@/stores/uiStore';

/**
 * 同步选中源到资源库配置
 */
export function useSelectedSourceSync(
  selectedSource: StoredSourceEntry | null,
  onConfigSynced?: () => void,
) {
  const { setGitHubConfig, setGiteeConfig } = useSourceSelection();
  const lastSyncedSourceIdRef = useRef<string | null>(null);
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    const { editingSourceId, showSettingsModal } = useUIStore.getState();
    // 正在设置向导中编辑某源时，不要用「当前选中源」覆盖 imageStore
    if (showSettingsModal && editingSourceId) {
      return;
    }

    if (selectedSource) {
      if (
        lastSyncedSourceIdRef.current === selectedSource.id &&
        !isInitialMountRef.current
      ) {
        return;
      }

      const sourceConfig = getRepoConfigFromSource(selectedSource);
      const port = getSourceSelectionPort();
      if (selectedSource.pluginId === 'github') {
        setGitHubConfig(sourceConfig);
        port.setStorageType('github');
      } else {
        setGiteeConfig(sourceConfig);
        port.setStorageType('gitee');
      }

      lastSyncedSourceIdRef.current = selectedSource.id;
      isInitialMountRef.current = false;

      if (onConfigSynced) {
        setTimeout(() => {
          port.initializeStorageIfNeeded();
          onConfigSynced();
        }, 100);
      }
    }
  }, [selectedSource, setGitHubConfig, setGiteeConfig, onConfigSynced]);
}
