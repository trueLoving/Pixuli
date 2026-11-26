/**
 * 扩展名 → MIME 与路径启发式（vault / platform 共用）。
 * 不含预览、压缩等 Kind 处理逻辑。
 */

/** 已知入库/同步相关扩展名 → MIME */
const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  pdf: 'application/pdf',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mkv: 'video/x-matroska',
  avi: 'video/x-msvideo',
  txt: 'text/plain',
  md: 'text/markdown',
  markdown: 'text/markdown',
  json: 'application/json',
};

/** 默认可同步的媒体/文档扩展名（含点） */
export const SYNCABLE_ASSET_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.bmp',
  '.webp',
  '.svg',
  '.pdf',
  '.mp4',
  '.webm',
  '.mov',
  '.mkv',
  '.avi',
  '.txt',
  '.md',
  '.markdown',
]);

const RASTER_IMAGE_EXT = /\.(jpe?g|png|gif|webp|svg|bmp)$/i;

export function extensionOfFileName(name: string): string {
  const base = name.replace(/^.*[/\\]/, '');
  const dot = base.lastIndexOf('.');
  if (dot < 0) return '';
  return base.slice(dot + 1).toLowerCase();
}

/** 按文件名猜测 MIME；未知则为 application/octet-stream */
export function guessMimeType(name: string): string {
  const ext = extensionOfFileName(name);
  return MIME_BY_EXTENSION[ext] ?? 'application/octet-stream';
}

/** 是否为位图/矢量图路径（用于宽高探测等，非 Kind match） */
export function isRasterImagePath(relativePath: string): boolean {
  return RASTER_IMAGE_EXT.test(relativePath);
}

/** @deprecated 使用 isRasterImagePath */
export const isImageFilePath = isRasterImagePath;

/** Git 树列举时是否纳入默认同步集合 */
export function isSyncableAssetName(fileName: string): boolean {
  const base = fileName.replace(/^.*[/\\]/, '');
  const dot = base.lastIndexOf('.');
  if (dot < 0) return false;
  return SYNCABLE_ASSET_EXTENSIONS.has(base.slice(dot).toLowerCase());
}
