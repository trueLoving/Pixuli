import React, { type ComponentType } from 'react';
import { matchPdfKind } from '../match';
import { capturePdfThumbnailFromUrl, type PdfReadFile } from '../pdfEngine';
import { PdfDocumentView } from './PdfDocumentView';

/** 宿主注入的 UI 注册表（结构兼容 app UiContributionRegistry） */
export type PdfUiHostRegistry = {
  registerPreview(contribution: {
    id: string;
    priority?: number;
    match: (input: {
      name: string;
      mimeType?: string;
      kind?: string;
    }) => boolean;
    component: ComponentType<{
      asset: { name: string };
      src: string | null;
      localPath?: string | null;
      variant: 'inspector' | 'modal';
      t: (key: string) => string;
    }>;
  }): void;
  registerThumbnail(contribution: {
    id: string;
    priority?: number;
    match: (input: {
      name: string;
      mimeType?: string;
      kind?: string;
    }) => boolean;
    capture: (url: string) => Promise<string | null>;
  }): void;
};

/** 宿主工作区能力；由 app 一次注入，插件内部接线到 PdfDocumentView */
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
  registry: PdfUiHostRegistry,
  options: ContributePdfUiOptions = {},
): void {
  const { readFile, isLocalAvailable, thumbnailSize = 64 } = options;

  registry.registerPreview({
    id: 'kind.pdf',
    priority: 10,
    match: matchPdfUiInput,
    component: function PdfKindPreviewSlot({ src, localPath, variant, t }) {
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

  registry.registerThumbnail({
    id: 'kind.pdf',
    priority: 10,
    match: matchPdfUiInput,
    capture: url => capturePdfThumbnailFromUrl(url, thumbnailSize),
  });
}
