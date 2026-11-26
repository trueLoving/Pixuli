import { FileVideo } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { captureVideoThumbnail } from '../videoEngine';

export type VideoDocumentViewProps = {
  assetName: string;
  src: string | null;
  variant: 'inspector' | 'modal';
  openExternalLabel?: string;
};

function VideoInspectorPreview({
  assetName,
  src,
}: {
  assetName: string;
  src: string | null;
}) {
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
        <img src={videoThumb} alt={assetName} />
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

function VideoModalPreview({
  src,
  openExternalLabel = 'Open',
}: {
  src: string | null;
  openExternalLabel?: string;
}) {
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
      {openExternalLabel}
    </video>
  );
}

export function VideoDocumentView({
  assetName,
  src,
  variant,
  openExternalLabel,
}: VideoDocumentViewProps) {
  if (variant === 'modal') {
    return (
      <VideoModalPreview src={src} openExternalLabel={openExternalLabel} />
    );
  }
  return <VideoInspectorPreview assetName={assetName} src={src} />;
}
