import type { ImageItem } from '@pixuli/core/types';
import { useCallback } from 'react';
import { copyTextToClipboard } from '@/utils/clipboard';

/** 远端公网链接优先（同步后 publicUrl / githubUrl） */
export function resolveRemoteCopyUrl(image: ImageItem): string {
  return image.publicUrl || image.githubUrl || image.url;
}

export function useImageCopyUrl() {
  return useCallback(async (url: string, _type: 'url' | 'githubUrl') => {
    await copyTextToClipboard(url);
  }, []);
}
