import React, { useEffect, useState } from 'react';
import type { ImageItem } from '@pixuli/core/types';
import { FileVideo } from 'lucide-react';
import { getAssetKind } from '@/features/library/utils/assetKind';
import { resolveAssetThumbnail } from '@/features/library/utils/assetThumbnail';
import {
  downloadAssetLabelKey,
  downloadAssetOnPlatform,
  isOpenCancelled,
} from '@/platforms/openAsset';
import { getPlatform } from '@/platforms/platform';
import { showError, showSuccess } from '@/ui/feedback/toast';
import { MarkdownDocumentView } from './MarkdownDocumentView';
import { TextDocumentView } from './TextDocumentView';
import { useResolvedAssetUrl } from './useResolvedAssetUrl';

export function AssetInspectorFilePreview({
  image,
  t,
}: {
  image: ImageItem;
  t: (key: string) => string;
}) {
  const kind = getAssetKind(image);
  const src = useResolvedAssetUrl(image);
  const [videoThumb, setVideoThumb] = useState<string | null>(null);

  useEffect(() => {
    if (kind !== 'video' || !src) {
      setVideoThumb(null);
      return;
    }

    let cancelled = false;
    setVideoThumb(null);
    void resolveAssetThumbnail({
      id: image.id,
      url: src,
      name: image.name,
      type: image.type,
    }).then(thumb => {
      if (!cancelled) setVideoThumb(thumb);
    });

    return () => {
      cancelled = true;
    };
  }, [kind, src, image.id, image.name, image.type]);

  if (kind === 'markdown') {
    return (
      <div className="asset-inspector-preview asset-inspector-preview--markdown">
        <MarkdownDocumentView
          src={src}
          localPath={image.localPath}
          variant="inspector"
          loadingLabel={t('image.markdown.loading')}
          errorLabel={t('image.markdown.loadFailed')}
        />
      </div>
    );
  }

  if (kind === 'text') {
    return (
      <div className="asset-inspector-preview asset-inspector-preview--text">
        <TextDocumentView
          src={src}
          localPath={image.localPath}
          variant="inspector"
          loadingLabel={t('image.text.loading')}
          errorLabel={t('image.text.loadFailed')}
        />
      </div>
    );
  }

  if (!src) {
    return <div className="asset-inspector-preview" aria-hidden />;
  }

  if (kind === 'video') {
    if (videoThumb) {
      return (
        <div className="asset-inspector-preview asset-inspector-preview--video">
          <img src={videoThumb} alt={image.name} />
          <span className="asset-inspector-preview-badge" aria-hidden>
            ▶
          </span>
        </div>
      );
    }
    return (
      <div
        className="asset-inspector-preview asset-inspector-preview--video-fallback"
        aria-hidden
      >
        <FileVideo size={36} />
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
    <div className="asset-inspector-preview">
      <img src={src} alt={image.name} />
    </div>
  );
}
