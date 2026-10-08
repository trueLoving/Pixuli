import { useEffect, useState } from 'react';
import type { ImageItem } from '@pixuli/core/types';
import { resolveLocalPreviewUrl } from '@/features/workspace/localImageMapper';

/**
 * 本地 deferPreview 时 `url` 为空。有地址才返回字符串，否则 null（不要传给 src）。
 */
export function useResolvedAssetUrl(
  image:
    | Pick<ImageItem, 'id' | 'url' | 'localPath' | 'type'>
    | null
    | undefined,
): string | null {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const direct = image?.url?.trim() ?? '';
    if (direct) {
      setSrc(direct);
      return;
    }
    const localPath = image?.localPath;
    if (!localPath) {
      setSrc(null);
      return;
    }
    setSrc(null);
    void resolveLocalPreviewUrl(
      localPath,
      image?.type || 'application/octet-stream',
    )
      .then(url => {
        if (!cancelled) setSrc(url || null);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [image?.id, image?.url, image?.localPath, image?.type]);

  return src;
}
