import React from 'react';
import type { AssetItem } from '@pixuli/core/types';
import { getAssetKind } from '@/features/library/utils/assetKind';
import { KindPreviewHost } from './KindPreviewHost';
import { useResolvedAssetUrl } from './useResolvedAssetUrl';

export function AssetInspectorFilePreview({
  asset,
  t,
}: {
  asset: AssetItem;
  t: (key: string) => string;
}) {
  const src = useResolvedAssetUrl(asset);
  const kind = getAssetKind(asset);

  return (
    <KindPreviewHost
      asset={asset}
      src={src}
      variant="inspector"
      t={t}
      className={`asset-inspector-preview asset-inspector-preview--${kind}`}
    />
  );
}
