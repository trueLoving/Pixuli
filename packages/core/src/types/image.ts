export interface ImageItem {
  id: string;
  name: string;
  url: string;
  githubUrl: string;
  size: number;
  width: number;
  height: number;
  type: string;
  tags: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImageUploadData {
  file: File;
  name?: string;
  description?: string;
  tags?: string[];
}

export interface ImageCropOptions {
  aspectRatio?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface ImageEditData {
  id: string;
  name?: string;
  description?: string;
  tags?: string[];
}

export interface UploadProgress {
  id: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  message?: string;
  width?: number;
  height?: number;
}

export interface MultiImageUploadData {
  files: File[];
  name?: string;
  description?: string;
  tags?: string[];
}

export interface BatchUploadProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
  items: UploadProgress[];
}

export interface ImageCompressionOptions {
  /** 压缩质量，0-1 之间，默认 0.8 */
  quality?: number;
  /** 最大宽度（像素），如果指定，会按比例缩放 */
  maxWidth?: number;
  /** 最大高度（像素），如果指定，会按比例缩放 */
  maxHeight?: number;
  /** 是否保持宽高比，默认 true */
  maintainAspectRatio?: boolean;
  /** 输出格式，默认 'image/jpeg'，可选 'image/jpeg' | 'image/png' | 'image/webp' */
  outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
  /** 是否仅在文件大小超过阈值时才压缩（字节），默认不限制 */
  minSizeToCompress?: number;
}

export interface ImageCompressionResult {
  /** 压缩后的文件 */
  compressedFile: File;
  /** 原始文件大小（字节） */
  originalSize: number;
  /** 压缩后文件大小（字节） */
  compressedSize: number;
  /** 压缩率（百分比） */
  compressionRatio: number;
  /** 原始尺寸 */
  originalDimensions: { width: number; height: number };
  /** 压缩后尺寸 */
  compressedDimensions: { width: number; height: number };
}

/** 图片处理统一结果（压缩/转换共用，Web 端为 Blob URL + File） */
export interface ImageProcessResult {
  /** 可访问的 URL（Web 为 blob: 或 data:） */
  uri: string;
  /** 处理后的 Blob，便于上传或再处理 */
  blob: Blob;
  /** 处理后的 File，便于表单或下载 */
  file: File;
  /** 原始大小（字节） */
  originalSize: number;
  /** 处理后大小（字节） */
  processedSize: number;
  /** 压缩/体积变化比例（0–1，如 0.3 表示体积变为 30%） */
  compressionRatio: number;
  /** 处理后宽度 */
  width: number;
  /** 处理后高度 */
  height: number;
  /** 原始宽度 */
  originalWidth: number;
  /** 原始高度 */
  originalHeight: number;
  /** 输出 MIME 类型 */
  mimeType: string;
}

/** 格式转换选项（与压缩选项兼容，用于 convert） */
export interface ImageConversionOptions {
  /** 质量 0–1，默认 0.9 */
  quality?: number;
  /** 最大宽度（像素） */
  maxWidth?: number;
  /** 最大高度（像素） */
  maxHeight?: number;
  /** 是否保持宽高比，默认 true */
  maintainAspectRatio?: boolean;
}
