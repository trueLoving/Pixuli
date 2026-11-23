import type { KindHandler } from '@pixuli/core/kinds';
import { matchPdfKind } from './match';
import { pdfKindManifest } from './manifest';

export class PdfKindHandler implements KindHandler {
  readonly manifest = pdfKindManifest;

  match(input: { name: string; mimeType?: string }): boolean {
    return matchPdfKind(input);
  }
}

export function createPdfKindHandler(): KindHandler {
  return new PdfKindHandler();
}
