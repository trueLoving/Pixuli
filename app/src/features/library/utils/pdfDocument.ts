import type { PDFDocumentProxy } from 'pdfjs-dist';
import {
  getWorkspaceAdapter,
  isWorkspaceAvailable,
} from '@/platforms/workspacePlatform';

type PdfjsModule = typeof import('pdfjs-dist');

let pdfjsPromise: Promise<PdfjsModule> | null = null;

/** 懒加载 pdfjs，并确保 worker 只配置一次 */
export function loadPdfjs(): Promise<PdfjsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then(pdfjs => {
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString();
      }
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

/**
 * 本机优先读盘为 ArrayBuffer；否则用 URL（含 blob）交给 pdfjs。
 */
export async function loadPdfDocument(
  localPath: string | null | undefined,
  src: string | null,
): Promise<PDFDocumentProxy> {
  const pdfjs = await loadPdfjs();
  const path = localPath?.trim();

  if (path && isWorkspaceAvailable()) {
    const bytes = await getWorkspaceAdapter().readFile(path);
    const data = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    );
    return pdfjs.getDocument({
      data,
      isEvalSupported: false,
    }).promise;
  }

  if (!src) {
    throw new Error('no pdf source');
  }

  return pdfjs.getDocument({
    url: src,
    withCredentials: false,
    isEvalSupported: false,
  }).promise;
}
