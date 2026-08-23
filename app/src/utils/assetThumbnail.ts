import type { ImageItem } from '@pixuli/core/types';
import { getAssetKind } from '@/utils/assetKind';

const THUMB_SIZE = 64;
const CACHE_LIMIT = 120;
const MAX_CONCURRENT = 3;

type CacheKey = string;

const resultCache = new Map<CacheKey, string | null>();
const inflight = new Map<CacheKey, Promise<string | null>>();
let activeJobs = 0;
const waitQueue: Array<() => void> = [];

function cacheKey(
  item: Pick<ImageItem, 'id' | 'url' | 'name' | 'type'>,
): CacheKey {
  return `${getAssetKind(item)}:${item.url || item.id}`;
}

function remember(key: CacheKey, value: string | null): string | null {
  if (resultCache.has(key)) resultCache.delete(key);
  resultCache.set(key, value);
  while (resultCache.size > CACHE_LIMIT) {
    const oldest = resultCache.keys().next().value;
    if (oldest === undefined) break;
    resultCache.delete(oldest);
  }
  return value;
}

async function withConcurrency<T>(task: () => Promise<T>): Promise<T> {
  if (activeJobs >= MAX_CONCURRENT) {
    await new Promise<void>(resolve => {
      waitQueue.push(resolve);
    });
  }
  activeJobs += 1;
  try {
    return await task();
  } finally {
    activeJobs -= 1;
    const next = waitQueue.shift();
    next?.();
  }
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
  ctx.drawImage(source, (size - dw) / 2, (size - dh) / 2, dw, dh);
}

export async function captureVideoThumbnail(
  url: string,
): Promise<string | null> {
  if (typeof document === 'undefined' || !url) return null;

  return new Promise(resolve => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    if (/^https?:/i.test(url)) {
      video.crossOrigin = 'anonymous';
    }

    let settled = false;
    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      video.removeAttribute('src');
      video.load();
      resolve(value);
    };

    const timeout = window.setTimeout(() => finish(null), 8000);

    video.onerror = () => {
      window.clearTimeout(timeout);
      finish(null);
    };

    video.onloadeddata = () => {
      try {
        const duration = video.duration;
        const seekTo =
          Number.isFinite(duration) && duration > 0
            ? Math.min(0.35, duration * 0.08)
            : 0.05;
        video.currentTime = seekTo;
      } catch {
        window.clearTimeout(timeout);
        finish(null);
      }
    };

    video.onseeked = () => {
      window.clearTimeout(timeout);
      try {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (!vw || !vh) {
          finish(null);
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = THUMB_SIZE;
        canvas.height = THUMB_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          finish(null);
          return;
        }
        drawCover(ctx, video, vw, vh, THUMB_SIZE);
        finish(canvas.toDataURL('image/jpeg', 0.72));
      } catch {
        finish(null);
      }
    };

    video.src = url;
  });
}

export async function capturePdfThumbnail(url: string): Promise<string | null> {
  if (typeof document === 'undefined' || !url) return null;

  try {
    const pdfjs = await import('pdfjs-dist');
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString();
    }

    const loadingTask = pdfjs.getDocument({
      url,
      withCredentials: false,
      isEvalSupported: false,
    });
    const doc = await loadingTask.promise;
    try {
      const page = await doc.getPage(1);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.max(THUMB_SIZE / base.width, THUMB_SIZE / base.height);
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
      canvas.width = THUMB_SIZE;
      canvas.height = THUMB_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      drawCover(ctx, temp, temp.width, temp.height, THUMB_SIZE);
      return canvas.toDataURL('image/jpeg', 0.72);
    } finally {
      await doc.destroy();
    }
  } catch {
    return null;
  }
}

/**
 * 为视频/PDF 生成列表缩略图（data URL），带内存缓存与并发上限。
 * 图片请直接使用 `item.url`；失败返回 null，由 UI 回退类型图标。
 */
export function resolveAssetThumbnail(
  item: Pick<ImageItem, 'id' | 'url' | 'name' | 'type'>,
): Promise<string | null> {
  const kind = getAssetKind(item);
  if (kind === 'image') {
    return Promise.resolve(item.url || null);
  }
  if (kind !== 'video' && kind !== 'pdf') {
    return Promise.resolve(null);
  }
  if (!item.url) return Promise.resolve(null);

  const key = cacheKey(item);
  if (resultCache.has(key)) {
    return Promise.resolve(resultCache.get(key) ?? null);
  }
  const pending = inflight.get(key);
  if (pending) return pending;

  const job = withConcurrency(async () => {
    const thumb =
      kind === 'video'
        ? await captureVideoThumbnail(item.url)
        : await capturePdfThumbnail(item.url);
    return remember(key, thumb);
  }).finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, job);
  return job;
}

/** 测试用：清空缩略图缓存 */
export function clearAssetThumbnailCache(): void {
  resultCache.clear();
  inflight.clear();
}
