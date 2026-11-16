import { useEffect, useState } from 'react';
import type { AssetItem } from '@pixuli/core/types';
import { resolveLocalPreviewUrl } from '@/features/workspace/localAssetMapper';

/**
 * 本地 deferPreview 时 `url` 为空。有地址才返回字符串，否则 null（不要传给 src）。
 */
export function useResolvedAssetUrl(
  asset:
    | Pick<AssetItem, 'id' | 'url' | 'localPath' | 'type'>
    | null
    | undefined,
): string | null {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const direct = asset?.url?.trim() ?? '';
    if (direct) {
      setSrc(direct);
      return;
    }
    const localPath = asset?.localPath;
    if (!localPath) {
      setSrc(null);
      return;
    }
    setSrc(null);
    void resolveLocalPreviewUrl(
      localPath,
      asset?.type || 'application/octet-stream',
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
  }, [asset?.id, asset?.url, asset?.localPath, asset?.type]);

  return src;
}
