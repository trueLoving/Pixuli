import React from 'react';
import { FileText } from 'lucide-react';
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

/** app 内置 kind UI（image/other）；其余 Kind 由插件贡献 */
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
}
