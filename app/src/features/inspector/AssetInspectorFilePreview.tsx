import React from 'react';
import type { ImageItem } from '@pixuli/core/types';
import { getAssetKind } from '@/features/library/utils/assetKind';

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

  if (kind === 'video') {
    return (
      <div className="asset-inspector-preview asset-inspector-preview--media">
        <video src={image.url} controls playsInline preload="metadata">
          {t('image.inspector.openExternal')}
        </video>
      </div>
    );
  }

  if (kind === 'pdf') {
    return (
      <div className="asset-inspector-preview asset-inspector-preview--media">
        <iframe title={image.name} src={image.url} />
        <a
          className="asset-inspector-open-external"
          href={image.url}
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
          href={image.url}
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
      <img src={image.url} alt={image.name} />
    </button>
  );
}
