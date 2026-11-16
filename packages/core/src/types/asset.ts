/**
 * 库内条目与上传/编辑契约（图 / PDF / 视频 / Markdown / txt 等）。
 * 位图处理类型见 `imageProcess.ts`；采集元数据见 `imageCapture.ts`。
 */
import type { ImageCaptureMetadata } from './imageCapture';

/** REF-607：与 `StorageProviderPublicUrl.resolveLinkKind` 一致 */
export type LinkKind = 'local' | 'remote-raw';

/** 本地工作区同步态（UI 默认折叠为仅本地 / 已同步两态） */
export type AssetSyncState =
  | 'local-only'
  | 'synced'
  | 'pending-push'
  | 'conflict';

export interface AssetItem {
  id: string;
  name: string;
  /** 远端存储相对路径（相对 provider config.path，可含子目录） */
  storagePath?: string;
  url: string;
  /**
   * @deprecated 使用 `publicUrl`；保留以兼容现有 GitHub raw 字段与远端列表。
   */
  githubUrl: string;
  size: number;
  width: number;
  height: number;
  type: string;
  tags: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
  /** REF-607：工作区内相对路径 */
  localPath?: string;
  /** REF-607：链接形态（本地预览 vs 远端公网） */
  linkKind?: LinkKind;
  /** REF-607：当前绑定远端下的公网 URL */
  publicUrl?: string;
  /** 本地工作区条目同步态（仅 local 列表模式） */
  syncState?: AssetSyncState;
  /** REF-511 #141：原生选图/拍照采集上下文 */
  captureMetadata?: ImageCaptureMetadata;
}

export interface AssetUploadData {
  /** Web/Desktop 为 File；Mobile 可为本地 URI 字符串 */
  file: File | string;
  name?: string;
  description?: string;
  tags?: string[];
  /** 目标文件夹（相对工作区路径）；默认当前资源库范围 */
  targetFolder?: string;
  /** 远端存储相对路径（含子目录）；sync / 指定路径上传时使用 */
  storagePath?: string;
  /** REF-511 #141：拍照/选图采集上下文 */
  captureMetadata?: ImageCaptureMetadata;
}

/** Web/Desktop 上传表单：file 恒为 File */
export type WebAssetUploadData = Omit<AssetUploadData, 'file'> & { file: File };

export function getUploadFileName(file: File | string, name?: string): string {
  if (typeof file === 'string') {
    return name || file.split('/').pop() || 'image.jpg';
  }
  return name || file.name;
}

export interface AssetEditData {
  id: string;
  name?: string;
  description?: string;
  tags?: string[];
  /** 目标文件夹相对路径（仅本地工作区移动） */
  targetFolder?: string;
}

export interface UploadProgress {
  id: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  message?: string;
  width?: number;
  height?: number;
}

export interface MultiAssetUploadData {
  files: File[];
  name?: string;
  description?: string;
  tags?: string[];
  /** 目标文件夹（相对工作区路径）；默认当前资源库范围 */
  targetFolder?: string;
  /** 与 `files` 同序；无元数据项可省略 */
  captureMetadataList?: (ImageCaptureMetadata | undefined)[];
}

export interface BatchUploadProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
  items: UploadProgress[];
}
