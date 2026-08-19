import type { LocalImageIndexEntry } from './types';

const TEXT_ENCODER = new TextEncoder();

export function stablePathId(relativePath: string): string {
  const normalized = relativePath.replace(/^\/+/, '').replace(/\\/g, '/');
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  return `img_${Math.abs(hash).toString(36)}`;
}

export function basename(relativePath: string): string {
  const parts = relativePath.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] || relativePath;
}

export function guessMimeType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  if (lower.endsWith('.mkv')) return 'video/x-matroska';
  if (lower.endsWith('.avi')) return 'video/x-msvideo';
  if (lower.endsWith('.txt')) return 'text/plain';
  if (lower.endsWith('.md')) return 'text/markdown';
  if (lower.endsWith('.json')) return 'application/json';
  return 'application/octet-stream';
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function encodeJson(value: unknown): Uint8Array {
  return TEXT_ENCODER.encode(JSON.stringify(value, null, 2));
}

export function decodeJson<T>(data: Uint8Array): T {
  return JSON.parse(new TextDecoder().decode(data)) as T;
}

export function createIndexEntry(
  relativePath: string,
  size: number,
  meta?: Partial<LocalImageIndexEntry>,
): LocalImageIndexEntry {
  const name = meta?.name ?? basename(relativePath);
  const timestamp = nowIso();
  return {
    id: meta?.id ?? stablePathId(relativePath),
    relativePath,
    name,
    size,
    width: meta?.width ?? 0,
    height: meta?.height ?? 0,
    mimeType: meta?.mimeType ?? guessMimeType(name),
    tags: meta?.tags ?? [],
    description: meta?.description,
    createdAt: meta?.createdAt ?? timestamp,
    updatedAt: meta?.updatedAt ?? timestamp,
    deletedAt: meta?.deletedAt,
    bindingId: meta?.bindingId,
    remotePath: meta?.remotePath,
    syncState: meta?.syncState ?? 'local-only',
    captureMetadata: meta?.captureMetadata,
  };
}

export function isImageFilePath(relativePath: string): boolean {
  return /\.(jpe?g|png|gif|webp|svg)$/i.test(relativePath);
}

/** 工作区可入库的文件（图 / PDF / 视频 / 其它），忽略点文件。 */
export function isIngestibleFilePath(relativePath: string): boolean {
  const name = basename(relativePath);
  if (!name || name.startsWith('.')) {
    return false;
  }
  return true;
}
