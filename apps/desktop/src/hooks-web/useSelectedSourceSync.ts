import { useEffect, useRef } from 'react';
import { useImageStore } from '../stores/imageStore';

/**
 * 同步选中源到 store 的配置
 */
export function useSelectedSourceSync(
  selectedSource: any,
  onConfigSynced?: () => void,
) {
  const { setGitHubConfig, setGiteeConfig } = useImageStore();
  const lastSyncedSourceIdRef = useRef<string | null>(null);
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    if (selectedSource) {
      // 避免重复同步同一个源（但首次加载时允许同步）
      if (
        lastSyncedSourceIdRef.current === selectedSource.id &&
        !isInitialMountRef.current
      ) {
        return;
      }

      const sourceConfig = {
        owner: selectedSource.owner,
        repo: selectedSource.repo,
        branch: selectedSource.branch,
        token: selectedSource.token,
        path: selectedSource.path,
      };
      if (selectedSource.type === 'github') {
        setGitHubConfig(sourceConfig);
        useImageStore.setState({ storageType: 'github' });
      } else {
        setGiteeConfig(sourceConfig);
        useImageStore.setState({ storageType: 'gitee' });
      }

      // 标记已同步，并触发回调
      // 注意：setGitHubConfig 和 setGiteeConfig 内部已经调用了 initializeStorage()
      lastSyncedSourceIdRef.current = selectedSource.id;
      isInitialMountRef.current = false;

      if (onConfigSynced) {
        // 延迟执行，确保 store 状态已更新和存储服务已初始化
        setTimeout(() => {
          const { storageService, initializeStorage } =
            useImageStore.getState();
          if (!storageService) {
            initializeStorage();
          }
          onConfigSynced();
        }, 100);
      }
    }
  }, [selectedSource, setGitHubConfig, setGiteeConfig, onConfigSynced]);
}
