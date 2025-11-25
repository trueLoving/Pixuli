/**
 * 图片工具函数
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageInfo extends ImageDimensions {
  naturalWidth: number;
  naturalHeight: number;
  aspectRatio: number;
  orientation: 'landscape' | 'portrait' | 'square';
}

/**
 * 获取图片的宽度和高度
 * @param file 图片文件
 * @returns Promise<ImageDimensions> 图片尺寸信息
 */
export function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };

    // 创建对象URL
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    // 图片加载完成后清理对象URL
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        width: img.width,
        height: img.height,
      });
    };
  });
}

/**
 * 获取图片的详细信息
 * @param file 图片文件
 * @returns Promise<ImageInfo> 图片详细信息
 */
export function getImageInfo(file: File): Promise<ImageInfo> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const width = img.width;
      const height = img.height;
      const naturalWidth = img.naturalWidth || width;
      const naturalHeight = img.naturalHeight || height;
      const aspectRatio = width / height;

      let orientation: 'landscape' | 'portrait' | 'square';
      if (width > height) {
        orientation = 'landscape';
      } else if (width < height) {
        orientation = 'portrait';
      } else {
        orientation = 'square';
      }

      resolve({
        width,
        height,
        naturalWidth,
        naturalHeight,
        aspectRatio,
        orientation,
      });
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };

    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.width;
      const height = img.height;
      const naturalWidth = img.naturalWidth || width;
      const naturalHeight = img.naturalHeight || height;
      const aspectRatio = width / height;

      let orientation: 'landscape' | 'portrait' | 'square';
      if (width > height) {
        orientation = 'landscape';
      } else if (width < height) {
        orientation = 'portrait';
      } else {
        orientation = 'square';
      }

      resolve({
        width,
        height,
        naturalWidth,
        naturalHeight,
        aspectRatio,
        orientation,
      });
    };
  });
}

/**
 * 从URL获取图片尺寸
 * @param url 图片URL
 * @returns Promise<ImageDimensions> 图片尺寸信息
 */
export function getImageDimensionsFromUrl(
  url: string
): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.naturalWidth, // 使用 naturalWidth 获取真实尺寸
        height: img.naturalHeight, // 使用 naturalHeight 获取真实尺寸
      });
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };

    // 设置跨域属性以支持 GitHub 图片
    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}

/**
 * 检查文件是否为图片
 * @param file 文件对象
 * @returns boolean 是否为图片文件
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * 获取图片文件类型
 * @param file 图片文件
 * @returns string 图片类型
 */
export function getImageType(file: File): string {
  return file.type || 'image/unknown';
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns string 格式化后的大小
 */
export function formatImageFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 计算图片的显示尺寸
 * @param originalWidth 原始宽度
 * @param originalHeight 原始高度
 * @param maxWidth 最大宽度
 * @param maxHeight 最大高度
 * @param keepAspectRatio 是否保持宽高比
 * @returns ImageDimensions 计算后的尺寸
 */
export function calculateDisplayDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth?: number,
  maxHeight?: number,
  keepAspectRatio: boolean = true
): ImageDimensions {
  let width = originalWidth;
  let height = originalHeight;

  if (maxWidth && maxHeight) {
    if (keepAspectRatio) {
      // 保持宽高比，选择较小的缩放比例
      const scaleX = maxWidth / originalWidth;
      const scaleY = maxHeight / originalHeight;
      const scale = Math.min(scaleX, scaleY);

      width = Math.round(originalWidth * scale);
      height = Math.round(originalHeight * scale);
    } else {
      // 不保持宽高比，直接限制
      width = Math.min(originalWidth, maxWidth);
      height = Math.min(originalHeight, maxHeight);
    }
  } else if (maxWidth) {
    // 只限制宽度
    if (keepAspectRatio) {
      const scale = maxWidth / originalWidth;
      width = maxWidth;
      height = Math.round(originalHeight * scale);
    } else {
      width = Math.min(originalWidth, maxWidth);
    }
  } else if (maxHeight) {
    // 只限制高度
    if (keepAspectRatio) {
      const scale = maxHeight / originalHeight;
      height = maxHeight;
      width = Math.round(originalWidth * scale);
    } else {
      height = Math.min(originalHeight, maxHeight);
    }
  }

  return { width, height };
}

/**
 * 创建图片预览URL
 * @param file 图片文件
 * @returns string 预览URL
 */
export function createImagePreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * 清理图片预览URL
 * @param url 预览URL
 */
export function revokeImagePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * 将代理 URL 转换为真实的 Gitee URL
 * 用于在界面上显示可访问的真实 URL
 * @param url 可能是代理 URL 或真实 URL
 * @returns 真实的 Gitee URL
 */
export function getRealGiteeUrl(url: string): string {
  // 检查是否是代理 URL
  if (url.startsWith('/api/gitee-proxy/')) {
    // 移除代理前缀，添加 Gitee 域名
    return `https://gitee.com${url.replace('/api/gitee-proxy', '')}`;
  }
  // 如果已经是真实 URL 或其他格式，直接返回
  return url;
}

/**
 * 压缩图片文件
 * @param file 原始图片文件
 * @param options 压缩选项
 * @returns Promise<ImageCompressionResult> 压缩结果
 */
export async function compressImage(
  file: File,
  options: {
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    maintainAspectRatio?: boolean;
    outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
    minSizeToCompress?: number;
  } = {}
): Promise<{
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  originalDimensions: { width: number; height: number };
  compressedDimensions: { width: number; height: number };
}> {
  const {
    quality = 0.8,
    maxWidth,
    maxHeight,
    maintainAspectRatio = true,
    outputFormat = 'image/jpeg',
    minSizeToCompress,
  } = options;

  // 如果设置了最小压缩大小，且文件小于该大小，直接返回原文件
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
        // 获取原始尺寸
        const originalWidth = img.naturalWidth || img.width;
        const originalHeight = img.naturalHeight || img.height;
        const originalDimensions = {
          width: originalWidth,
          height: originalHeight,
        };

        // 计算压缩后的尺寸
        let targetWidth = originalWidth;
        let targetHeight = originalHeight;

        if (maxWidth || maxHeight) {
          const calculatedDimensions = calculateDisplayDimensions(
            originalWidth,
            originalHeight,
            maxWidth,
            maxHeight,
            maintainAspectRatio
          );
          targetWidth = calculatedDimensions.width;
          targetHeight = calculatedDimensions.height;
        }

        // 创建 canvas
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('无法创建 Canvas 上下文'));
          return;
        }

        // 绘制图片到 canvas
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // 转换为 Blob
        canvas.toBlob(
          blob => {
            URL.revokeObjectURL(objectUrl);

            if (!blob) {
              reject(new Error('图片压缩失败：无法生成 Blob'));
              return;
            }

            // 创建压缩后的文件
            const fileName = file.name;
            const fileExtension = outputFormat.split('/')[1] || 'jpg';
            const compressedFileName =
              fileName.replace(/\.[^/.]+$/, '') + '.' + fileExtension;

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
          quality
        );
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(
          new Error(
            `图片压缩失败: ${error instanceof Error ? error.message : '未知错误'}`
          )
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
