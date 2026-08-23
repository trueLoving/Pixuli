import type { ImageItem } from '@pixuli/core/types';
import { File, FileText, FileVideo } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { getAssetKind } from '@/utils/assetKind';
import { resolveAssetThumbnail } from '@/utils/assetThumbnail';

interface AssetThumbProps {
  item: ImageItem;
}

/**
 * 资源库行缩略图：图片懒加载；视频取帧；PDF 首页渲染；失败回退类型图标。
 */
export const AssetThumb: React.FC<AssetThumbProps> = ({ item }) => {
  const kind = getAssetKind(item);
  const [src, setSrc] = useState<string | null>(
    kind === 'image' ? item.url || null : null,
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);

    if (kind === 'image') {
      setSrc(item.url || null);
      return () => {
        cancelled = true;
      };
    }

    if (kind !== 'video' && kind !== 'pdf') {
      setSrc(null);
      return () => {
        cancelled = true;
      };
    }

    setSrc(null);
    void resolveAssetThumbnail({
      id: item.id,
      url: item.url,
      name: item.name,
      type: item.type,
    }).then(url => {
      if (cancelled) return;
      if (url) setSrc(url);
      else setFailed(true);
    });

    return () => {
      cancelled = true;
    };
  }, [item.id, item.url, item.name, item.type, kind]);

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
    </span>
  );
};
