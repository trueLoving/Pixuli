import {
  convertedFileName,
  croppedFileName,
  cropOutputMime,
  type ImageConvertRequest,
  type ImageCropRect,
  type OutputMimeType,
} from './naming';
import { webImageProcessorService } from './imageProcessor';

export type ProcessedImagePayload = {
  data: Uint8Array;
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
};

function mimeForSource(name: string, type?: string): string {
  if (type?.startsWith('image/')) return type;
  return 'image/jpeg';
}

function cropFile(
  file: File,
  crop: ImageCropRect,
  mime: OutputMimeType,
): Promise<{ file: File; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const maxW = img.naturalWidth || img.width;
      const maxH = img.naturalHeight || img.height;
      const x = Math.max(
        0,
        Math.min(Math.round(crop.x), Math.max(0, maxW - 1)),
      );
      const y = Math.max(
        0,
        Math.min(Math.round(crop.y), Math.max(0, maxH - 1)),
      );
      const width = Math.max(1, Math.min(Math.round(crop.width), maxW - x));
      const height = Math.max(1, Math.min(Math.round(crop.height), maxH - y));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('无法创建 Canvas 上下文'));
        return;
      }
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
      canvas.toBlob(
        blob => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error('裁剪失败'));
            return;
          }
          resolve({
            file: new File([blob], croppedFileName(file.name, mime), {
              type: mime,
            }),
            width,
            height,
          });
        },
        mime,
        mime === 'image/png' ? undefined : 0.92,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('图片加载失败'));
    };
    img.src = objectUrl;
  });
}

export async function convertImageBytes(
  source: { name: string; type?: string },
  bytes: Uint8Array,
  request: ImageConvertRequest,
): Promise<ProcessedImagePayload> {
  const file = new File([bytes.slice()], source.name, {
    type: mimeForSource(source.name, source.type),
  });
  const result = await webImageProcessorService.convert(file, request.format, {
    quality: request.quality,
    maxWidth: request.maxEdge,
    maxHeight: request.maxEdge,
    maintainAspectRatio: true,
    allowUpscale: false,
  });
  const data = new Uint8Array(await result.blob.arrayBuffer());
  if (result.uri.startsWith('blob:')) URL.revokeObjectURL(result.uri);
  return {
    data,
    fileName: convertedFileName(source.name, request.format),
    mimeType: request.format,
    width: result.width,
    height: result.height,
  };
}

export async function cropImageBytes(
  source: { name: string; type?: string },
  bytes: Uint8Array,
  crop: ImageCropRect,
): Promise<ProcessedImagePayload> {
  const mime = cropOutputMime(source.name, source.type);
  const file = new File([bytes.slice()], source.name, {
    type: mimeForSource(source.name, source.type),
  });
  const result = await cropFile(file, crop, mime);
  const data = new Uint8Array(await result.file.arrayBuffer());
  return {
    data,
    fileName: result.file.name,
    mimeType: mime,
    width: result.width,
    height: result.height,
  };
}
