/**
 * Web/Desktop 图片处理服务（纯 Web 技术：Canvas API）
 * 供 Web 与 Electron 渲染进程使用，不依赖 WASM。
 * 相关运行环境依赖由使用方保证，本包不安装图片处理相关依赖，仅以 peerDependency 声明（如需要）。
 */

import type {
  ImageCompressionOptions,
  ImageProcessResult,
  ImageConversionOptions,
} from '../../types/image';
import {
  calculateDisplayDimensions,
  getImageDimensions,
} from '../../utils/imageUtils';

const DEFAULT_QUALITY = 0.8;
const DEFAULT_CONVERT_QUALITY = 0.9;

/** 支持的输出 MIME 类型（与 Canvas toBlob 一致） */
export type OutputMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

function getExtensionFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return map[mime] ?? 'jpg';
}

/**
 * 使用 Canvas 将图片绘制并导出为 Blob
 */
function processImageWithCanvas(
  file: File,
  options: {
    outputFormat: OutputMimeType;
    quality: number;
    maxWidth?: number;
    maxHeight?: number;
    maintainAspectRatio: boolean;
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

        const { width: targetWidth, height: targetHeight } =
          options.maxWidth || options.maxHeight
            ? calculateDisplayDimensions(
                originalWidth,
                originalHeight,
                options.maxWidth,
                options.maxHeight,
                options.maintainAspectRatio,
              )
            : { width: originalWidth, height: originalHeight };

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

/**
 * Web 图片处理服务（纯 Canvas 实现）
 */
export class WebImageProcessorService {
  /**
   * 压缩图片（质量 + 可选尺寸）
   * @param file 原始图片文件
   * @param options 压缩选项
   */
  async compress(
    file: File,
    options: ImageCompressionOptions = {},
  ): Promise<ImageProcessResult> {
    const {
      quality = DEFAULT_QUALITY,
      maxWidth,
      maxHeight,
      maintainAspectRatio = true,
      outputFormat = 'image/jpeg',
      minSizeToCompress,
    } = options;

    if (minSizeToCompress != null && file.size < minSizeToCompress) {
      const dims = await getImageDimensions(file);
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      const uri = URL.createObjectURL(blob);
      return {
        uri,
        blob,
        file,
        originalSize: file.size,
        processedSize: file.size,
        compressionRatio: 1,
        width: dims.width,
        height: dims.height,
        originalWidth: dims.width,
        originalHeight: dims.height,
        mimeType: file.type,
      };
    }

    const { blob, originalWidth, originalHeight, width, height } =
      await processImageWithCanvas(file, {
        outputFormat: outputFormat as OutputMimeType,
        quality,
        maxWidth,
        maxHeight,
        maintainAspectRatio,
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

  /**
   * 格式转换（可同时改尺寸与质量）
   * @param file 原始图片文件
   * @param outputFormat 目标 MIME 类型
   * @param options 可选质量与尺寸
   */
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
    } = options;

    const { blob, originalWidth, originalHeight, width, height } =
      await processImageWithCanvas(file, {
        outputFormat,
        quality,
        maxWidth,
        maxHeight,
        maintainAspectRatio,
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

/** 单例，供 Web/Desktop 直接使用 */
export const webImageProcessorService = new WebImageProcessorService();
