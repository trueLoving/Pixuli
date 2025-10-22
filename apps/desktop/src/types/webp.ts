export interface WebPCompressOptions {
  /** 压缩质量 (0-100) */
  quality?: number;
  /** 是否使用无损压缩 */
  lossless?: boolean;
}

export interface WebPCompressResult {
  /** 压缩后的数据 */
  data: Array<number>;
  /** 原始大小 */
  originalSize: number;
  /** 压缩后大小 */
  compressedSize: number;
  /** 压缩率 (0-1) */
  compressionRatio: number;
  /** 压缩后的宽度 */
  width: number;
  /** 压缩后的高度 */
  height: number;
}

export interface ImageInfo {
  width: number;
  height: number;
  format: string;
  size: number;
  channels: number;
}
