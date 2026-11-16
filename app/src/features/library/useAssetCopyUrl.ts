import type { AssetItem } from '@pixuli/core/types';
import { useCallback } from 'react';
import { copyTextToClipboard } from '@/utils/clipboard';
import { resolveRemoteCopyUrl } from './copyLink';

export { resolveRemoteCopyUrl };

export function useAssetCopyUrl() {
  return useCallback(async (url: string, _type: 'url' | 'githubUrl') => {
    await copyTextToClipboard(url);
  }, []);
}
