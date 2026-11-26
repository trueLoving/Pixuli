import React from 'react';

export type ImageDocumentViewProps = {
  assetName: string;
  src: string | null;
  variant: 'inspector' | 'modal';
};

export function ImageDocumentView({
  assetName,
  src,
  variant,
}: ImageDocumentViewProps) {
  if (!src) return null;
  if (variant === 'modal') {
    return (
      <img src={src} alt={assetName} className="asset-preview-modal-image" />
    );
  }
  return <img src={src} alt={assetName} />;
}
