// 图片格式转换相关类型定义

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'gif' | 'bmp' | 'tiff';

export interface FormatConversionOptions {
  // 目标格式
  targetFormat: ImageFormat;
  // 质量设置 (1-100)
  quality?: number;
  // 是否保持透明度 (仅对支持透明度的格式有效)
  preserveTransparency?: boolean;
  // 是否无损转换
  lossless?: boolean;
  // 颜色空间
  colorSpace?: 'rgb' | 'rgba' | 'grayscale';
  // 是否调整尺寸
  resize?: {
    width?: number;
    height?: number;
    maintainAspectRatio?: boolean;
  };
}

export interface FormatConversionResult {
  convertedFile: File;
  originalSize: number;
  convertedSize: number;
  sizeChange: number;
  sizeChangeRatio: number;
  originalFormat: string;
  targetFormat: string;
  originalDimensions: { width: number; height: number };
  convertedDimensions: { width: number; height: number };
  conversionTime: number;
}

export interface FormatInfo {
  format: ImageFormat;
  name: string;
  description: string;
  mimeType: string;
  extensions: string[];
  supportsTransparency: boolean;
  supportsLossless: boolean;
  commonUse: string;
}

export const SUPPORTED_FORMATS: FormatInfo[] = [
  {
    format: 'jpeg',
    name: 'JPEG',
    description: 'Lossy compression format, suitable for photos',
    mimeType: 'image/jpeg',
    extensions: ['.jpg', '.jpeg'],
    supportsTransparency: false,
    supportsLossless: false,
    commonUse: 'Photos, web images',
  },
  {
    format: 'png',
    name: 'PNG',
    description: 'Lossless compression format with transparency support',
    mimeType: 'image/png',
    extensions: ['.png'],
    supportsTransparency: true,
    supportsLossless: true,
    commonUse: 'Icons, transparent images, screenshots',
  },
  {
    format: 'webp',
    name: 'WebP',
    description: 'Modern format with high compression ratio',
    mimeType: 'image/webp',
    extensions: ['.webp'],
    supportsTransparency: true,
    supportsLossless: true,
    commonUse: 'Web images, modern applications',
  },
  {
    format: 'gif',
    name: 'GIF',
    description: 'Format supporting animation',
    mimeType: 'image/gif',
    extensions: ['.gif'],
    supportsTransparency: true,
    supportsLossless: true,
    commonUse: 'Animated images, simple graphics',
  },
  {
    format: 'bmp',
    name: 'BMP',
    description: 'Uncompressed bitmap format',
    mimeType: 'image/bmp',
    extensions: ['.bmp'],
    supportsTransparency: false,
    supportsLossless: true,
    commonUse: 'Raw images, printing',
  },
  {
    format: 'tiff',
    name: 'TIFF',
    description: 'High-quality image format',
    mimeType: 'image/tiff',
    extensions: ['.tiff', '.tif'],
    supportsTransparency: true,
    supportsLossless: true,
    commonUse: 'Professional images, printing',
  },
];

export const DEFAULT_CONVERSION_OPTIONS: FormatConversionOptions = {
  targetFormat: 'webp',
  quality: 80,
  preserveTransparency: true,
  lossless: false,
  colorSpace: 'rgb',
};

/**
 * 根据文件扩展名获取格式信息
 */
export function getFormatFromExtension(filename: string): ImageFormat | null {
  const ext = filename.toLowerCase().split('.').pop();
  if (!ext) return null;

  for (const format of SUPPORTED_FORMATS) {
    if (format.extensions.some(e => e.slice(1) === ext)) {
      return format.format;
    }
  }
  return null;
}

/**
 * 根据 MIME 类型获取格式信息
 */
export function getFormatFromMimeType(mimeType: string): ImageFormat | null {
  for (const format of SUPPORTED_FORMATS) {
    if (format.mimeType === mimeType) {
      return format.format;
    }
  }
  return null;
}

/**
 * 获取格式信息
 */
export function getFormatInfo(format: ImageFormat): FormatInfo | null {
  return SUPPORTED_FORMATS.find(f => f.format === format) || null;
}

/**
 * 检查格式是否支持透明度
 */
export function supportsTransparency(format: ImageFormat): boolean {
  const info = getFormatInfo(format);
  return info?.supportsTransparency || false;
}

/**
 * 检查格式是否支持无损压缩
 */
export function supportsLossless(format: ImageFormat): boolean {
  const info = getFormatInfo(format);
  return info?.supportsLossless || false;
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
    'image/tiff',
  ];
}
