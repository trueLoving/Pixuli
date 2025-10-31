import {
  WebPCompressOptions,
  WebPCompressResult,
} from '../features/image-compression/types';

// 导出工具接口和类型
export interface CompressionOptions {
  quality?: number;
  lossless?: boolean;
}

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  originalDimensions: { width: number; height: number };
  compressedDimensions: { width: number; height: number };
}

export const DEFAULT_COMPRESSION_OPTIONS: CompressionOptions = {
  quality: 80,
  lossless: false,
};

export class ImageCompressionService {
  /**
   * 压缩单张图片为WebP格式
   */
  static async compressImage(
    imageFile: File,
    options?: WebPCompressOptions
  ): Promise<WebPCompressResult> {
    const startTime = performance.now();

    try {
      // 检查WASM API是否可用
      if (!window.wasmAPI || !window.wasmAPI.compressToWebp) {
        throw new Error('WASM API 不可用，请确保应用已正确初始化');
      }

      // 将File转换为Uint8Array
      const arrayBuffer = await imageFile.arrayBuffer();
      const imageData = new Uint8Array(arrayBuffer);

      // 调用WASM压缩函数
      const result = await window.wasmAPI.compressToWebp(
        Array.from(imageData),
        options
      );

      const endTime = performance.now();
      console.log(
        `WASM WebP 压缩完成: ${(endTime - startTime).toFixed(2)}ms, 压缩率: ${(result.compressionRatio * 100).toFixed(2)}%`
      );

      return result;
    } catch (error) {
      const endTime = performance.now();
      console.error(
        `WebP compression failed after ${(endTime - startTime).toFixed(2)}ms:`,
        error
      );
      throw new Error(
        `WebP压缩失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 批量压缩图片为WebP格式
   */
  static async batchCompressImages(
    imageFiles: File[],
    options?: WebPCompressOptions
  ): Promise<WebPCompressResult[]> {
    const startTime = performance.now();

    try {
      // 检查WASM API是否可用
      if (!window.wasmAPI || !window.wasmAPI.batchCompressToWebp) {
        throw new Error('WASM API 不可用，请确保应用已正确初始化');
      }

      // 将所有File转换为Array<number>
      const imagesData = await Promise.all(
        imageFiles.map(async file => {
          const arrayBuffer = await file.arrayBuffer();
          return Array.from(new Uint8Array(arrayBuffer));
        })
      );

      // 调用WASM批量压缩函数
      const results = await window.wasmAPI.batchCompressToWebp(
        imagesData,
        options
      );

      const endTime = performance.now();
      const avgCompressionRatio =
        results.reduce((sum, result) => sum + result.compressionRatio, 0) /
        results.length;
      console.log(
        `WASM 批量压缩完成: ${(endTime - startTime).toFixed(2)}ms, 平均压缩率: ${(avgCompressionRatio * 100).toFixed(2)}%`
      );

      return results;
    } catch (error) {
      const endTime = performance.now();
      console.error(
        `Batch WebP compression failed after ${(endTime - startTime).toFixed(2)}ms:`,
        error
      );
      throw new Error(
        `批量WebP压缩失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 获取图片信息
   */
  static async getImageInfo(imageFile: File): Promise<any> {
    try {
      const arrayBuffer = await imageFile.arrayBuffer();
      const imageData = new Uint8Array(arrayBuffer);

      const infoString = await window.wasmAPI.getImageInfo(
        Array.from(imageData)
      );
      return JSON.parse(infoString);
    } catch (error) {
      console.error('Get image info failed:', error);
      throw new Error(
        `获取图片信息失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 创建压缩后的File对象
   */
  static createCompressedFile(
    result: WebPCompressResult,
    originalFileName: string
  ): File {
    const webpFileName = originalFileName.replace(/\.[^/.]+$/, '.webp');
    // 将Array<number>转换为Uint8Array，然后转换为ArrayBuffer
    const uint8Array = new Uint8Array(result.data);
    return new File([uint8Array], webpFileName, { type: 'image/webp' });
  }

  /**
   * 获取自动压缩选项
   */
  static getAutoCompressionOptions(fileSize: number): WebPCompressOptions {
    // 根据文件大小自动选择压缩质量
    if (fileSize > 5 * 1024 * 1024) {
      // > 5MB
      return { quality: 60 };
    } else if (fileSize > 2 * 1024 * 1024) {
      // > 2MB
      return { quality: 70 };
    } else if (fileSize > 1 * 1024 * 1024) {
      // > 1MB
      return { quality: 80 };
    } else {
      return { quality: 85 };
    }
  }

  /**
   * 检查是否支持WebP
   */
  static isWebPSupported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch (error) {
      return false;
    }
  }
}

/**
 * 压缩图片文件（仅使用 WASM WebP 压缩）
 * @param file 原始图片文件
 * @param options 压缩选项
 * @returns Promise<CompressionResult> 压缩结果
 */
export async function compressImage(
  file: File,
  options: Partial<CompressionOptions> = {}
): Promise<CompressionResult> {
  const finalOptions = { ...DEFAULT_COMPRESSION_OPTIONS, ...options };

  // 获取原始图片尺寸
  const originalDimensions = await getImageDimensions(file);

  try {
    // 使用 WASM WebP 压缩
    const webpOptions: WebPCompressOptions = {
      quality: finalOptions.quality,
      lossless: finalOptions.lossless,
    };

    const webpResult = await ImageCompressionService.compressImage(
      file,
      webpOptions
    );
    const compressedFile = ImageCompressionService.createCompressedFile(
      webpResult,
      file.name
    );

    return {
      compressedFile,
      originalSize: file.size,
      compressedSize: webpResult.compressedSize,
      compressionRatio: webpResult.compressionRatio * 100,
      originalDimensions,
      compressedDimensions: {
        width: webpResult.width,
        height: webpResult.height,
      },
    };
  } catch (error) {
    console.error('WASM WebP compression failed:', error);
    throw new Error(
      `图片压缩失败: ${error instanceof Error ? error.message : '未知错误'}`
    );
  }
}

/**
 * 获取图片尺寸
 * @param file 图片文件
 * @returns Promise<{width: number, height: number}>
 */
async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 批量压缩图片（仅使用 WASM WebP 压缩）
 * @param files 图片文件数组
 * @param options 压缩选项
 * @returns Promise<CompressionResult[]> 压缩结果数组
 */
export async function compressImages(
  files: File[],
  options: Partial<CompressionOptions> = {}
): Promise<CompressionResult[]> {
  try {
    const finalOptions = { ...DEFAULT_COMPRESSION_OPTIONS, ...options };
    const webpOptions: WebPCompressOptions = {
      quality: finalOptions.quality,
      lossless: finalOptions.lossless,
    };

    // 使用 WASM 批量压缩
    const webpResults = await ImageCompressionService.batchCompressImages(
      files,
      webpOptions
    );

    return webpResults.map((webpResult, index) => {
      const file = files[index];
      return {
        compressedFile: ImageCompressionService.createCompressedFile(
          webpResult,
          file.name
        ),
        originalSize: webpResult.originalSize,
        compressedSize: webpResult.compressedSize,
        compressionRatio: webpResult.compressionRatio * 100,
        originalDimensions: {
          width: webpResult.width,
          height: webpResult.height,
        },
        compressedDimensions: {
          width: webpResult.width,
          height: webpResult.height,
        },
      };
    });
  } catch (error) {
    console.error('Batch WASM WebP compression failed:', error);
    throw new Error(
      `批量图片压缩失败: ${error instanceof Error ? error.message : '未知错误'}`
    );
  }
}

/**
 * 根据文件大小自动选择压缩选项
 * @param fileSize 文件大小（字节）
 * @returns CompressionOptions 推荐的压缩选项
 */
export function getAutoCompressionOptions(
  fileSize: number
): CompressionOptions {
  const sizeMB = fileSize / (1024 * 1024);

  if (sizeMB > 10) {
    // 超大文件：高压缩
    return {
      quality: 60,
      lossless: false,
    };
  } else if (sizeMB > 5) {
    // 大文件：中等压缩
    return {
      quality: 70,
      lossless: false,
    };
  } else if (sizeMB > 2) {
    // 中等文件：轻微压缩
    return {
      quality: 80,
      lossless: false,
    };
  } else {
    // 小文件：保持原样或轻微压缩
    return {
      quality: 85,
      lossless: false,
    };
  }
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 检查文件是否为图片
 * @param file 文件对象
 * @returns 是否为图片文件
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * 获取支持的图片格式
 * @returns 支持的图片格式数组
 */
export function getSupportedImageFormats(): string[] {
  return [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
  ];
}
