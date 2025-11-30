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
  const hasSyncedRef = useRef(false);
  const lastSyncedSourceIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedSource) {
      // 避免重复同步同一个源
      if (lastSyncedSourceIdRef.current === selectedSource.id) {
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
      hasSyncedRef.current = true;
      if (onConfigSynced) {
        // 延迟执行，确保 store 状态已更新
        setTimeout(() => {
          onConfigSynced();
        }, 0);
      }
    } else {
      hasSyncedRef.current = false;
      lastSyncedSourceIdRef.current = null;
    }
  }, [selectedSource, setGitHubConfig, setGiteeConfig, onConfigSynced]);
}
