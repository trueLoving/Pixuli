import type { PluginUiHost } from '@pixuli/core/plugin-runtime';
import { matchVideoKind } from '../match';
import { captureVideoThumbnail } from '../videoEngine';
import { VideoDocumentView } from './VideoDocumentView';

export type ContributeVideoUiOptions = {
  thumbnailSize?: number;
};

function matchVideoUiInput(input: {
  name: string;
  mimeType?: string;
  kind?: string;
}): boolean {
  if (input.kind === 'video') return true;
  return matchVideoKind({ name: input.name, mimeType: input.mimeType });
}

export function contributeVideoUi(
  ui: PluginUiHost,
  options: ContributeVideoUiOptions = {},
): void {
  const { thumbnailSize = 64 } = options;

  ui.registerPreview({
    id: 'kind.video',
    priority: 10,
    match: matchVideoUiInput,
    component: function VideoKindPreviewSlot({
      asset,
      src,
      variant,
      t,
    }: {
      asset: { name: string };
      src: string | null;
      localPath?: string | null;
      variant: 'inspector' | 'modal';
      t: (key: string) => string;
    }) {
      return (
        <VideoDocumentView
          assetName={asset.name}
          src={src}
          variant={variant}
          openExternalLabel={t('image.inspector.openExternal')}
        />
      );
    },
  });

  ui.registerThumbnail({
    id: 'kind.video',
    priority: 10,
    match: matchVideoUiInput,
    capture: url => captureVideoThumbnail(url, thumbnailSize),
  });
}

export function unregisterVideoUi(ui: PluginUiHost): void {
  ui.unregisterPreview('kind.video');
  ui.unregisterThumbnail('kind.video');
}
