import type { KindPluginRegistry } from '@pixuli/core/kinds';
import { createPdfKindHandler } from './PdfKindHandler';
import { pdfKindManifest } from './manifest';

export function registerPdfKind(registry: KindPluginRegistry): void {
  registry.register(pdfKindManifest, createPdfKindHandler);
}

export { pdfKindManifest };
