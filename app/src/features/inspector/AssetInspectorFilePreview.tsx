import React from 'react';
import type { ImageItem } from '@pixuli/core/types';
import { getAssetKind } from '@/features/library/utils/assetKind';
import {
  downloadAssetLabelKey,
  downloadAssetOnPlatform,
  isOpenCancelled,
} from '@/platforms/openAsset';
import { getPlatform } from '@/platforms/platform';
import { showError, showSuccess } from '@/ui/feedback/toast';
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

  if (kind === 'pdf' || kind === 'other') {
    const platform = getPlatform();
    const download = () => {
      void downloadAssetOnPlatform(platform, {
        name: image.name,
        url: src,
        localPath: image.localPath,
      })
        .then(result => {
          if (result === 'mobile') {
            showSuccess(t('image.inspector.downloadSaved'));
          }
        })
        .catch(error => {
          if (isOpenCancelled(error)) return;
          showError(t('image.inspector.downloadFailed'));
        });
    };
    return (
      <div className="asset-inspector-preview asset-inspector-preview--file">
        <button
          type="button"
          className="asset-inspector-open-external"
          onClick={download}
        >
          {t(downloadAssetLabelKey())}
        </button>
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
