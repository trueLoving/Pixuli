import { useEffect } from 'react';
import { useImageStore } from '../stores/imageStore';

/**
 * 同步选中源到 store 的配置
 */
export function useSelectedSourceSync(selectedSource: any) {
  const { setGitHubConfig, setGiteeConfig } = useImageStore();

  useEffect(() => {
    if (selectedSource) {
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
    }
  }, [selectedSource, setGitHubConfig, setGiteeConfig]);
}
