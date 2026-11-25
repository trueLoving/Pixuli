import React, { useEffect, useState } from 'react';
import { FileText, FileVideo } from 'lucide-react';
import { captureVideoThumbnail } from '@/features/library/utils/assetThumbnail';
import {
  downloadAssetLabelKey,
  downloadAssetOnPlatform,
  isOpenCancelled,
} from '@/platforms/openAsset';
import { getPlatform } from '@/platforms/platform';
import { showError, showSuccess } from '@/ui/feedback/toast';
import type { KindPreviewProps, UiContributionRegistry } from './uiRegistry';

function ImagePreview({ asset, src, variant }: KindPreviewProps) {
  if (!src) return null;
  if (variant === 'modal') {
    return (
      <img src={src} alt={asset.name} className="asset-preview-modal-image" />
    );
  }
  return <img src={src} alt={asset.name} />;
}

function VideoInspectorPreview({ asset, src }: KindPreviewProps) {
  const [videoThumb, setVideoThumb] = useState<string | null>(null);

  useEffect(() => {
    if (!src) {
      setVideoThumb(null);
      return;
    }
    let cancelled = false;
    setVideoThumb(null);
    void captureVideoThumbnail(src).then(thumb => {
      if (!cancelled) setVideoThumb(thumb);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (videoThumb) {
    return (
      <div className="asset-inspector-preview--video">
        <img src={videoThumb} alt={asset.name} />
        <span className="asset-inspector-preview-badge" aria-hidden>
          ▶
        </span>
      </div>
    );
  }
  return (
    <div className="asset-inspector-preview--video-fallback" aria-hidden>
      <FileVideo size={36} />
    </div>
  );
}

function VideoModalPreview({ asset, src, t }: KindPreviewProps) {
  if (!src) return null;
  return (
    <video
      key={src}
      src={src}
      controls
      playsInline
      preload="metadata"
      className="asset-preview-modal-media"
    >
      {t('image.inspector.openExternal')}
    </video>
  );
}

function VideoPreview(props: KindPreviewProps) {
  if (props.variant === 'modal') return <VideoModalPreview {...props} />;
  return <VideoInspectorPreview {...props} />;
}

function OtherPreview({ asset, src, variant, t }: KindPreviewProps) {
  const download = () => {
    if (!src) return;
    const platform = getPlatform();
    void downloadAssetOnPlatform(platform, {
      name: asset.name,
      url: src,
      localPath: asset.localPath,
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

  if (variant === 'modal') {
    return (
      <div className="asset-preview-modal-file">
        <FileText size={48} aria-hidden />
        <p className="asset-preview-modal-file-name">{asset.name}</p>
        <button
          type="button"
          className="asset-preview-modal-download"
          onClick={download}
        >
          {t(downloadAssetLabelKey())}
        </button>
      </div>
    );
  }

  return (
    <div className="asset-inspector-preview--file">
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

/** app 内置 kind UI（image/video/other）；markdown/text/pdf 由 Kind 插件贡献 */
export function contributeBuiltinKindUi(
  registry: UiContributionRegistry,
): void {
  registry.registerPreview({
    id: 'builtin.image',
    priority: 0,
    match: input => input.kind === 'image',
    component: ImagePreview,
  });
  registry.registerPreview({
    id: 'builtin.video',
    priority: 0,
    match: input => input.kind === 'video',
    component: VideoPreview,
  });
  registry.registerPreview({
    id: 'builtin.other',
    priority: -10,
    match: input => input.kind === 'other',
    component: OtherPreview,
  });

  registry.registerThumbnail({
    id: 'builtin.image',
    priority: 0,
    match: input => input.kind === 'image',
    capture: async url => url || null,
  });
  registry.registerThumbnail({
    id: 'builtin.video',
    priority: 0,
    match: input => input.kind === 'video',
    capture: captureVideoThumbnail,
  });
}
