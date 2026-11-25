import React from 'react';
import type { AssetItem } from '@pixuli/core/types';
import { getAssetKind } from '@/features/library/utils/assetKind';
import { startPluginRuntime } from '@/plugins/runtime';
import { uiRegistry } from '@/plugins/uiRegistry';

export function KindPreviewHost({
  asset,
  src,
  variant,
  t,
  className,
}: {
  asset: AssetItem;
  src: string | null;
  variant: 'inspector' | 'modal';
  t: (key: string) => string;
  className?: string;
}) {
  startPluginRuntime();
  const kind = getAssetKind(asset);
  const contribution =
    uiRegistry.resolvePreview({
      name: asset.name,
      mimeType: asset.type,
      kind,
    }) ??
    // 无专用预览时降级为下载打开（builtin.other）
    uiRegistry.resolvePreview({
      name: asset.name,
      mimeType: asset.type,
      kind: 'other',
    });

  if (!contribution) {
    return className ? <div className={className} aria-hidden /> : null;
  }

  const Preview = contribution.component;
  const body = (
    <Preview
      asset={asset}
      src={src}
      localPath={asset.localPath}
      variant={variant}
      t={t}
    />
  );

  if (!className) return body;
  return <div className={className}>{body}</div>;
}
