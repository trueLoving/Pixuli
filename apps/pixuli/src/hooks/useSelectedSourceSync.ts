import {
  getRepoConfigFromSource,
  type StoredSourceEntry,
} from '@pixuli/core/sources';
import { useEffect, useRef } from 'react';
import { useImageStore } from '../stores/imageStore';
import { useUIStore } from '../stores/uiStore';

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
    const { showConfigModal, editingSourceId } = useUIStore.getState();
    // 正在编辑某源时，不要用「当前选中源」覆盖 imageStore（避免 Gitee 编辑弹窗拿到 GitHub 配置）
    if (showConfigModal && editingSourceId) {
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
