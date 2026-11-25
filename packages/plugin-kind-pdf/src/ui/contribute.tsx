import React from 'react';
import type { PluginUiHost } from '@pixuli/core/plugin-runtime';
import { matchPdfKind } from '../match';
import { capturePdfThumbnailFromUrl, type PdfReadFile } from '../pdfEngine';
import { PdfDocumentView } from './PdfDocumentView';

/** 宿主工作区能力；由 PluginApi.ui.getKindCapabilities() 注入 */
export type ContributePdfUiOptions = {
  readFile?: PdfReadFile;
  isLocalAvailable?: () => boolean;
  thumbnailSize?: number;
};

function matchPdfUiInput(input: {
  name: string;
  mimeType?: string;
  kind?: string;
}): boolean {
  if (input.kind === 'pdf') return true;
  return matchPdfKind({ name: input.name, mimeType: input.mimeType });
}

export function contributePdfUi(
  ui: PluginUiHost,
  options: ContributePdfUiOptions = {},
): void {
  const { readFile, isLocalAvailable, thumbnailSize = 64 } = options;

  ui.registerPreview({
    id: 'kind.pdf',
    priority: 10,
    match: matchPdfUiInput,
    component: function PdfKindPreviewSlot({
      src,
      localPath,
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
        <PdfDocumentView
          src={src}
          localPath={localPath}
          variant={variant}
          readFile={readFile}
          isLocalAvailable={isLocalAvailable}
          loadingLabel={t('image.pdf.loading')}
          errorLabel={t('image.pdf.loadFailed')}
          pageLabel={(page, total) =>
            t('image.pdf.pageOf')
              .replace('{page}', String(page))
              .replace('{total}', String(total))
          }
        />
      );
    },
  });

  ui.registerThumbnail({
    id: 'kind.pdf',
    priority: 10,
    match: matchPdfUiInput,
    capture: url => capturePdfThumbnailFromUrl(url, thumbnailSize),
  });
}

export function unregisterPdfUi(ui: PluginUiHost): void {
  ui.unregisterPreview('kind.pdf');
  ui.unregisterThumbnail('kind.pdf');
}
