/**
 * React Native 版本的图片工具函数
 * 适配 packages/ui 的工具函数逻辑
 */

import { Image } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

// 使用 legacy API 以避免弃用警告
// @ts-ignore
const FileSystem = require('expo-file-system/legacy');

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

/**
 * 图片格式类型
 */
export type ImageFormat = 'jpeg' | 'png' | 'webp';

/**
 * 图片处理选项
 */
export interface ImageProcessOptions {
  /** 压缩质量 (0-1) */
  compress?: number;
  /** 目标格式 */
  format?: ImageFormat;
  /** 目标宽度 */
  width?: number;
  /** 目标高度 */
  height?: number;
  /** 是否保持宽高比 */
  keepAspectRatio?: boolean;
  /** 裁剪区域 */
  crop?: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  };
}

/**
 * 图片处理结果
 */
export interface ImageProcessResult {
  uri: string;
  width: number;
  height: number;
  size?: number;
  originalSize?: number;
  originalWidth?: number;
  originalHeight?: number;
  compressionRatio?: number; // 压缩率 (0-1)
  sizeReduction?: number; // 减少的字节数
  sizeReductionPercent?: number; // 减少的百分比
}

/**
 * 处理图片（压缩、格式转换、尺寸调整、裁剪）
 * @param uri 原始图片 URI
 * @param options 处理选项
 * @returns Promise<ImageProcessResult> 处理后的图片信息
 */
export async function processImage(
  uri: string,
  options: ImageProcessOptions = {}
): Promise<ImageProcessResult> {
  try {
    const {
      compress = 1,
      format,
      width,
      height,
      keepAspectRatio = true,
      crop,
    } = options;

    // 获取原始图片信息
    const originalDimensions = await getImageDimensionsFromUri(uri);
    const originalSize = await getFileSizeFromUri(uri);

    // 构建操作数组
    const actions: ImageManipulator.Action[] = [];

    // 如果有裁剪，先裁剪
    if (crop) {
      actions.push({
        crop: {
          originX: crop.originX,
          originY: crop.originY,
          width: crop.width,
          height: crop.height,
        },
      });
    }

    // 如果有尺寸调整
    if (width || height) {
      actions.push({
        resize: {
          width: width || undefined,
          height: height || undefined,
        },
      });
    }

    // 转换格式枚举
    let saveFormat: ImageManipulator.SaveFormat | undefined;
    if (format) {
      switch (format) {
        case 'jpeg':
          saveFormat = ImageManipulator.SaveFormat.JPEG;
          break;
        case 'png':
          saveFormat = ImageManipulator.SaveFormat.PNG;
          break;
        case 'webp':
          saveFormat = ImageManipulator.SaveFormat.WEBP;
          break;
        default:
          saveFormat = undefined;
      }
    }

    // 执行操作
    let result: ImageManipulator.ImageResult;
    if (actions.length > 0) {
      result = await ImageManipulator.manipulateAsync(uri, actions, {
        compress,
        format: saveFormat,
      });
    } else {
      // 只压缩或转换格式
      result = await ImageManipulator.manipulateAsync(uri, [], {
        compress,
        format: saveFormat,
      });
    }

    // 获取处理后的图片信息
    const dimensions = await getImageDimensionsFromUri(result.uri);
    const processedSize = await getFileSizeFromUri(result.uri);

    // 计算压缩率和减少量
    const compressionRatio =
      originalSize > 0 ? processedSize / originalSize : 1;
    const sizeReduction = originalSize - processedSize;
    const sizeReductionPercent =
      originalSize > 0 ? (sizeReduction / originalSize) * 100 : 0;

    return {
      uri: result.uri,
      width: dimensions.width,
      height: dimensions.height,
      size: processedSize,
      originalSize,
      originalWidth: originalDimensions.width,
      originalHeight: originalDimensions.height,
      compressionRatio,
      sizeReduction,
      sizeReductionPercent,
    };
  } catch (error) {
    console.error('图片处理失败:', error);
    throw new Error(
      `图片处理失败: ${error instanceof Error ? error.message : '未知错误'}`
    );
  }
}

/**
 * 获取文件大小（从 URI）
 * @param uri 文件 URI
 * @returns Promise<number> 文件大小（字节）
 */
export async function getFileSizeFromUri(uri: string): Promise<number> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists && 'size' in fileInfo) {
      return fileInfo.size;
    }
    return 0;
  } catch (error) {
    console.warn('获取文件大小失败:', error);
    return 0;
  }
}
