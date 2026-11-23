import type { PDFDocumentProxy } from 'pdfjs-dist';

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

/** 由宿主注入：读本地工作区文件（Uint8Array） */
export type PdfReadFile = (path: string) => Promise<Uint8Array>;

export type OpenPdfDocumentOptions = {
  localPath?: string | null;
  src?: string | null;
  readFile?: PdfReadFile;
  /** 默认：有 readFile 且 localPath 非空时尝试本机 */
  isLocalAvailable?: () => boolean;
};

/**
 * 本机优先读盘为 ArrayBuffer；否则用 URL（含 blob）交给 pdfjs。
 * 不依赖 app platforms — 由调用方注入 readFile。
 */
export async function openPdfDocument(
  options: OpenPdfDocumentOptions,
): Promise<PDFDocumentProxy> {
  const { localPath, src, readFile } = options;
  const pdfjs = await loadPdfjs();
  const path = localPath?.trim();
  const localOk = options.isLocalAvailable?.() ?? Boolean(readFile && path);

  if (path && readFile && localOk) {
    const bytes = await readFile(path);
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

function drawCover(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sw: number,
  sh: number,
  size: number,
): void {
  const scale = Math.max(size / sw, size / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  const dx = (size - dw) / 2;
  const dy = (size - dh) / 2;
  ctx.drawImage(source, dx, dy, dw, dh);
}

/**
 * 从 URL 渲染首页缩略图（data URL）。需在浏览器 / jsdom+canvas 环境调用。
 */
export async function capturePdfThumbnailFromUrl(
  url: string,
  size = 64,
): Promise<string | null> {
  if (typeof document === 'undefined' || !url) return null;

  try {
    const pdfjs = await loadPdfjs();
    const doc = await pdfjs.getDocument({
      url,
      withCredentials: false,
      isEvalSupported: false,
    }).promise;
    try {
      const page = await doc.getPage(1);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.max(size / base.width, size / base.height);
      const viewport = page.getViewport({ scale });
      const temp = document.createElement('canvas');
      temp.width = Math.ceil(viewport.width);
      temp.height = Math.ceil(viewport.height);
      const tempCtx = temp.getContext('2d');
      if (!tempCtx) return null;

      await page.render({
        canvasContext: tempCtx,
        viewport,
      }).promise;

      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      drawCover(ctx, temp, temp.width, temp.height, size);
      return canvas.toDataURL('image/jpeg', 0.72);
    } finally {
      await doc.destroy();
    }
  } catch {
    return null;
  }
}

/** @internal 测试用：重置懒加载缓存 */
export function __resetPdfjsForTests(): void {
  pdfjsPromise = null;
}
