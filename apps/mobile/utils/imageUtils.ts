/**
 * React Native 版本的图片工具函数
 * 适配 packages/ui 的工具函数逻辑
 */

import { Image } from 'react-native';

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
 * 获取图片的宽度和高度（从本地 URI）
 * @param uri 图片 URI
 * @returns Promise<ImageDimensions> 图片尺寸信息
 */
export async function getImageDimensionsFromUri(
  uri: string
): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width: number, height: number) => {
        resolve({ width, height });
      },
      (error: Error) => {
        reject(new Error('图片加载失败: ' + error.message));
      }
    );
  });
}

/**
 * 获取图片的详细信息
 * @param uri 图片 URI
 * @returns Promise<ImageInfo> 图片详细信息
 */
export async function getImageInfoFromUri(uri: string): Promise<ImageInfo> {
  const dimensions = await getImageDimensionsFromUri(uri);
  const { width, height } = dimensions;
  const aspectRatio = width / height;

  let orientation: 'landscape' | 'portrait' | 'square';
  if (width > height) {
    orientation = 'landscape';
  } else if (width < height) {
    orientation = 'portrait';
  } else {
    orientation = 'square';
  }

  return {
    width,
    height,
    naturalWidth: width,
    naturalHeight: height,
    aspectRatio,
    orientation,
  };
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
