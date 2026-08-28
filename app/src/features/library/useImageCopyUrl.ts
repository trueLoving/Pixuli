import type { ImageItem } from '@pixuli/core/types';
import { useCallback } from 'react';
import { copyTextToClipboard } from '@/utils/clipboard';
import { resolveRemoteCopyUrl } from './publishContract';

export { resolveRemoteCopyUrl };

export function useImageCopyUrl() {
  return useCallback(async (url: string, _type: 'url' | 'githubUrl') => {
    await copyTextToClipboard(url);
  }, []);
}
