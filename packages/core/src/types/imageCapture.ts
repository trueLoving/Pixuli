/** REF-511 #141：移动端/原生选图时的拍摄上下文（sidecar 可持久化子集） */

export type ImageCaptureSource = 'camera' | 'gallery' | 'file';

export interface ImageGeoLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
}

/** 可写入 sidecar 的 EXIF 子集（不含序列号等敏感字段） */
export interface ImageExifSummary {
  make?: string;
  model?: string;
  orientation?: number;
  exposureTime?: string;
  fNumber?: number;
  iso?: number;
  focalLength?: number;
}

export interface ImageCaptureMetadata {
  source: ImageCaptureSource;
  /** 拍摄时间（优先 EXIF DateTimeOriginal，回退文件 mtime / 采集时刻） */
  takenAt: string;
  /** 应用内采集时间 */
  capturedAt: string;
  fileName: string;
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  /** 设备路径或 content URI（Capacitor `Photo.path` 等） */
  localPath?: string;
  /** 仅当 EXIF 含 GPS 时填充；无权限/无数据则为空 */
  location?: ImageGeoLocation;
  exif?: ImageExifSummary;
}
