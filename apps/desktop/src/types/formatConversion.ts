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
    description: '有损压缩格式，适合照片',
    mimeType: 'image/jpeg',
    extensions: ['.jpg', '.jpeg'],
    supportsTransparency: false,
    supportsLossless: false,
    commonUse: '照片、网络图片',
  },
  {
    format: 'png',
    name: 'PNG',
    description: '无损压缩格式，支持透明度',
    mimeType: 'image/png',
    extensions: ['.png'],
    supportsTransparency: true,
    supportsLossless: true,
    commonUse: '图标、透明图片、截图',
  },
  {
    format: 'webp',
    name: 'WebP',
    description: '现代格式，压缩率高',
    mimeType: 'image/webp',
    extensions: ['.webp'],
    supportsTransparency: true,
    supportsLossless: true,
    commonUse: '网络图片、现代应用',
  },
  {
    format: 'gif',
    name: 'GIF',
    description: '支持动画的格式',
    mimeType: 'image/gif',
    extensions: ['.gif'],
    supportsTransparency: true,
    supportsLossless: true,
    commonUse: '动画图片、简单图形',
  },
  {
    format: 'bmp',
    name: 'BMP',
    description: '无压缩位图格式',
    mimeType: 'image/bmp',
    extensions: ['.bmp'],
    supportsTransparency: false,
    supportsLossless: true,
    commonUse: '原始图像、打印',
  },
  {
    format: 'tiff',
    name: 'TIFF',
    description: '高质量图像格式',
    mimeType: 'image/tiff',
    extensions: ['.tiff', '.tif'],
    supportsTransparency: true,
    supportsLossless: true,
    commonUse: '专业图像、印刷',
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
