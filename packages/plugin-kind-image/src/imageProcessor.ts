/**
 * Web/Desktop 图片处理服务（纯 Canvas API）。
 * 供库内转换与可选上传压缩复用。
 */

import { compressImage } from './compressImage';
import { calculateDisplayDimensions } from './dimensions';
import type { OutputMimeType } from './naming';
import type {
  ImageCompressionOptions,
  ImageConversionOptions,
  ImageProcessResult,
} from './types';

const DEFAULT_CONVERT_QUALITY = 0.9;

function getExtensionFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return map[mime] ?? 'jpg';
}

function processImageWithCanvas(
  file: File,
  options: {
    outputFormat: OutputMimeType;
    quality: number;
    maxWidth?: number;
    maxHeight?: number;
    maintainAspectRatio: boolean;
    allowUpscale?: boolean;
  },
): Promise<{
  blob: Blob;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const originalWidth = img.naturalWidth || img.width;
        const originalHeight = img.naturalHeight || img.height;

        const fitted =
          options.maxWidth || options.maxHeight
            ? calculateDisplayDimensions(
                originalWidth,
                originalHeight,
                options.maxWidth,
                options.maxHeight,
                options.maintainAspectRatio,
              )
            : { width: originalWidth, height: originalHeight };
        const targetWidth =
          options.allowUpscale === false && fitted.width > originalWidth
            ? originalWidth
            : fitted.width;
        const targetHeight =
          options.allowUpscale === false && fitted.height > originalHeight
            ? originalHeight
            : fitted.height;

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('无法创建 Canvas 上下文'));
          return;
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(
          blob => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) {
              reject(new Error('图片处理失败：无法生成 Blob'));
              return;
            }
            resolve({
              blob,
              originalWidth,
              originalHeight,
              width: targetWidth,
              height: targetHeight,
            });
          },
          options.outputFormat,
          options.quality,
        );
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(
          new Error(
            `图片处理失败: ${error instanceof Error ? error.message : '未知错误'}`,
          ),
        );
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('图片加载失败'));
    };

    img.src = objectUrl;
  });
}

function buildResult(
  file: File,
  blob: Blob,
  mimeType: string,
  originalSize: number,
  originalWidth: number,
  originalHeight: number,
  width: number,
  height: number,
): ImageProcessResult {
  const ext = getExtensionFromMime(mimeType);
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const fileName = `${baseName}.${ext}`;
  const processedFile = new File([blob], fileName, {
    type: mimeType,
    lastModified: Date.now(),
  });
  const uri = URL.createObjectURL(blob);
  const processedSize = blob.size;
  const compressionRatio = originalSize > 0 ? processedSize / originalSize : 1;

  return {
    uri,
    blob,
    file: processedFile,
    originalSize,
    processedSize,
    compressionRatio,
    width,
    height,
    originalWidth,
    originalHeight,
    mimeType,
  };
}

export class WebImageProcessorService {
  async compress(
    file: File,
    options: ImageCompressionOptions = {},
  ): Promise<ImageProcessResult> {
    const result = await compressImage(file, options);
    const mimeType =
      options.outputFormat ?? (result.compressedFile.type || 'image/jpeg');
    const blob = result.compressedFile;
    const uri = URL.createObjectURL(blob);
    return {
      uri,
      blob,
      file: result.compressedFile,
      originalSize: result.originalSize,
      processedSize: result.compressedSize,
      compressionRatio:
        result.originalSize > 0
          ? result.compressedSize / result.originalSize
          : 1,
      width: result.compressedDimensions.width,
      height: result.compressedDimensions.height,
      originalWidth: result.originalDimensions.width,
      originalHeight: result.originalDimensions.height,
      mimeType,
    };
  }

  async convert(
    file: File,
    outputFormat: OutputMimeType,
    options: ImageConversionOptions = {},
  ): Promise<ImageProcessResult> {
    const {
      quality = DEFAULT_CONVERT_QUALITY,
      maxWidth,
      maxHeight,
      maintainAspectRatio = true,
      allowUpscale = true,
    } = options;

    const { blob, originalWidth, originalHeight, width, height } =
      await processImageWithCanvas(file, {
        outputFormat,
        quality,
        maxWidth,
        maxHeight,
        maintainAspectRatio,
        allowUpscale,
      });

    return buildResult(
      file,
      blob,
      outputFormat,
      file.size,
      originalWidth,
      originalHeight,
      width,
      height,
    );
  }
}

export const webImageProcessorService = new WebImageProcessorService();
