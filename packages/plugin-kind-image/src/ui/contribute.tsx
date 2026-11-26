import type { PluginUiHost } from '@pixuli/core/plugin-runtime';
import { matchImageKind } from '../match';
import { ImageDocumentView } from './ImageDocumentView';
import { ImageProcessPanel } from './ImageProcessPanel';

function matchImageUiInput(input: {
  name: string;
  mimeType?: string;
  kind?: string;
}): boolean {
  if (input.kind === 'image') return true;
  return matchImageKind({ name: input.name, mimeType: input.mimeType });
}

export function contributeImageUi(ui: PluginUiHost): void {
  ui.registerPreview({
    id: 'kind.image',
    priority: 10,
    match: matchImageUiInput,
    component: function ImageKindPreviewSlot({
      asset,
      src,
      variant,
    }: {
      asset: { name: string };
      src: string | null;
      localPath?: string | null;
      variant: 'inspector' | 'modal';
      t: (key: string) => string;
    }) {
      return (
        <ImageDocumentView assetName={asset.name} src={src} variant={variant} />
      );
    },
  });

  ui.registerThumbnail({
    id: 'kind.image',
    priority: 10,
    match: matchImageUiInput,
    capture: async url => url || null,
  });

  ui.registerProcess({
    id: 'kind.image',
    priority: 10,
    match: matchImageUiInput,
    placement: 'modal',
    labelKey: 'image.inspector.actionConvert',
    component: ImageProcessPanel,
  });
}

export function unregisterImageUi(ui: PluginUiHost): void {
  ui.unregisterPreview('kind.image');
  ui.unregisterThumbnail('kind.image');
  ui.unregisterProcess('kind.image');
}
