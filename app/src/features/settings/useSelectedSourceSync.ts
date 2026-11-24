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
  const { setActiveStorage } = useSourceSelection();
  const lastSyncedSourceIdRef = useRef<string | null>(null);
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    const { editingSourceId, showSettingsModal } = useUIStore.getState();
    // 正在设置向导中编辑某源时，不要用「当前选中源」覆盖 assetStore
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
      setActiveStorage(selectedSource.pluginId, sourceConfig);

      lastSyncedSourceIdRef.current = selectedSource.id;
      isInitialMountRef.current = false;

      if (onConfigSynced) {
        setTimeout(() => {
          getSourceSelectionPort().initializeStorageIfNeeded();
          onConfigSynced();
        }, 100);
      }
    }
  }, [selectedSource, setActiveStorage, onConfigSynced]);
}
