import { calculateDisplayDimensions, getImageDimensions } from './dimensions';
import type { ImageCompressionOptions, ImageCompressionResult } from './types';

/**
 * 压缩图片文件（Canvas）。供库内 `kind.process` 使用。
 * 压缩结果是新 File；库内 process 再经 saveProcessedAsset 落成新资源。
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {},
): Promise<ImageCompressionResult> {
  const {
    quality = 0.8,
    maxWidth,
    maxHeight,
    maintainAspectRatio = true,
    outputFormat = 'image/jpeg',
    minSizeToCompress,
  } = options;

  if (minSizeToCompress && file.size < minSizeToCompress) {
    const dimensions = await getImageDimensions(file);
    return {
      compressedFile: file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 0,
      originalDimensions: dimensions,
      compressedDimensions: dimensions,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const originalWidth = img.naturalWidth || img.width;
        const originalHeight = img.naturalHeight || img.height;
        const originalDimensions = {
          width: originalWidth,
          height: originalHeight,
        };

        let targetWidth = originalWidth;
        let targetHeight = originalHeight;

        if (maxWidth || maxHeight) {
          const calculatedDimensions = calculateDisplayDimensions(
            originalWidth,
            originalHeight,
            maxWidth,
            maxHeight,
            maintainAspectRatio,
          );
          targetWidth = calculatedDimensions.width;
          targetHeight = calculatedDimensions.height;
        }

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
              reject(new Error('图片压缩失败：无法生成 Blob'));
              return;
            }

            const fileExtension = outputFormat.split('/')[1] || 'jpg';
            const compressedFileName =
              file.name.replace(/\.[^/.]+$/, '') + '.' + fileExtension;

            const compressedFile = new File([blob], compressedFileName, {
              type: outputFormat,
              lastModified: Date.now(),
            });

            const compressionRatio =
              ((file.size - blob.size) / file.size) * 100;

            resolve({
              compressedFile,
              originalSize: file.size,
              compressedSize: blob.size,
              compressionRatio,
              originalDimensions,
              compressedDimensions: {
                width: targetWidth,
                height: targetHeight,
              },
            });
          },
          outputFormat,
          quality,
        );
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(
          new Error(
            `图片压缩失败: ${error instanceof Error ? error.message : '未知错误'}`,
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
