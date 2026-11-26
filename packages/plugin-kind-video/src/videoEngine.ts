const DEFAULT_THUMB_SIZE = 64;

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

/** 从视频 URL 截取封面缩略图（data URL）；失败返回 null */
export async function captureVideoThumbnail(
  url: string,
  thumbSize = DEFAULT_THUMB_SIZE,
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
        canvas.width = thumbSize;
        canvas.height = thumbSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          finish(null);
          return;
        }
        drawCover(ctx, video, vw, vh, thumbSize);
        finish(canvas.toDataURL('image/jpeg', 0.72));
      } catch {
        finish(null);
      }
    };

    video.src = url;
  });
}
