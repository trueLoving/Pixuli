import React from 'react';
import type { ImageItem } from '@pixuli/core/types';
import { getAssetKind } from '@/features/library/utils/assetKind';
import { useResolvedAssetUrl } from './useResolvedAssetUrl';

export function AssetInspectorFilePreview({
  image,
  onPreview,
  t,
}: {
  image: ImageItem;
  onPreview: () => void;
  t: (key: string) => string;
}) {
  const kind = getAssetKind(image);
  const src = useResolvedAssetUrl(image);

  if (!src) {
    return <div className="asset-inspector-preview" aria-hidden />;
  }

  if (kind === 'video') {
    return (
      <div className="asset-inspector-preview asset-inspector-preview--media">
        <video src={src} controls playsInline preload="metadata">
          {t('image.inspector.openExternal')}
        </video>
      </div>
    );
  }

  if (kind === 'pdf') {
    return (
      <div className="asset-inspector-preview asset-inspector-preview--media">
        <iframe title={image.name} src={src} />
        <a
          className="asset-inspector-open-external"
          href={src}
          target="_blank"
          rel="noreferrer"
        >
          {t('image.inspector.openExternal')}
        </a>
      </div>
    );
  }

  if (kind === 'other') {
    return (
      <div className="asset-inspector-preview asset-inspector-preview--file">
        <a
          className="asset-inspector-open-external"
          href={src}
          download={image.name}
        >
          {t('image.inspector.openExternal')}
        </a>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="asset-inspector-preview"
      onClick={onPreview}
      aria-label={t('image.inspector.previewHint')}
    >
      <img src={src} alt={image.name} />
    </button>
  );
}
