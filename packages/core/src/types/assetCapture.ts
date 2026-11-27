/**
 * REF-511 #141：入库时的采集上下文（sidecar 可持久化子集）。
 * 属资产元数据契约；位图 process（压缩/裁剪）在 `@pixuli/kind-image`。
 */

export type AssetCaptureSource = 'camera' | 'gallery' | 'file';

export interface AssetGeoLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
}

/** 可写入 sidecar 的 EXIF 子集（不含序列号等敏感字段；多为照片采集） */
export interface AssetExifSummary {
  make?: string;
  model?: string;
  orientation?: number;
  exposureTime?: string;
  fNumber?: number;
  iso?: number;
  focalLength?: number;
}

export interface AssetCaptureMetadata {
  source: AssetCaptureSource;
  /** 内容时间（优先 EXIF DateTimeOriginal，回退文件 mtime / 采集时刻） */
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
  location?: AssetGeoLocation;
  exif?: AssetExifSummary;
}
