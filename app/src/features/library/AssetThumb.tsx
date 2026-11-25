import type { AssetItem } from '@pixuli/core/types';
import { File, FileText, FileVideo } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { getAssetKind } from '@/features/library/utils/assetKind';
import { resolveAssetThumbnail } from '@/features/library/utils/assetThumbnail';
import { resolveLocalPreviewUrl } from '@/features/workspace/localAssetMapper';

interface AssetThumbProps {
  item: AssetItem;
}

/**
 * 资源库行缩略图：图片直出；其余经 Kind UI 槽位 `resolveThumbnail`；
 * 无贡献或失败时回退类型图标。
 */
export const AssetThumb: React.FC<AssetThumbProps> = ({ item }) => {
  const kind = getAssetKind(item);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setSrc(null);

    const run = async () => {
      let url = item.url;
      if (!url && item.localPath) {
        try {
          url = await resolveLocalPreviewUrl(
            item.localPath,
            item.type || 'application/octet-stream',
          );
        } catch {
          if (!cancelled) setFailed(true);
          return;
        }
      }
      if (cancelled) return;

      if (kind === 'image') {
        setSrc(url || null);
        return;
      }

      if (!url) {
        setSrc(null);
        return;
      }

      const thumb = await resolveAssetThumbnail({
        id: item.id,
        url,
        name: item.name,
        type: item.type,
      });
      if (cancelled) return;
      if (thumb) setSrc(thumb);
      else setSrc(null);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [item.id, item.url, item.localPath, item.name, item.type, kind]);

  if (src && !failed) {
    return (
      <span
        className={`asset-library-thumb-wrap asset-library-thumb-wrap--${kind}`}
        aria-hidden
      >
        <img
          className="asset-library-thumb"
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
        {kind === 'video' ? (
          <span className="asset-library-thumb-badge" aria-hidden>
            ▶
          </span>
        ) : null}
        {kind === 'pdf' ? (
          <span className="asset-library-thumb-badge asset-library-thumb-badge--pdf">
            PDF
          </span>
        ) : null}
      </span>
    );
  }

  const Icon =
    kind === 'video' ? FileVideo : kind === 'other' ? File : FileText;
  return (
    <span
      className={`asset-library-thumb-icon asset-library-thumb-icon--${kind}`}
      aria-hidden
    >
      <Icon size={16} />
      {kind === 'markdown' ? (
        <span className="asset-library-thumb-badge asset-library-thumb-badge--md">
          MD
        </span>
      ) : null}
      {kind === 'text' ? (
        <span className="asset-library-thumb-badge asset-library-thumb-badge--txt">
          TXT
        </span>
      ) : null}
      {kind === 'pdf' ? (
        <span className="asset-library-thumb-badge asset-library-thumb-badge--pdf">
          PDF
        </span>
      ) : null}
    </span>
  );
};
