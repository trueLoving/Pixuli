import { guessMimeType } from '../utils/mime';
import type { LocalAssetIndexEntry } from './types';

export {
  guessMimeType,
  isRasterImagePath,
  isImageFilePath,
} from '../utils/mime';

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
  meta?: Partial<LocalAssetIndexEntry>,
): LocalAssetIndexEntry {
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

/** 工作区可入库的文件（忽略点文件）；类型由 Kind / MIME 另判。 */
export function isIngestibleFilePath(relativePath: string): boolean {
  const name = basename(relativePath);
  if (!name || name.startsWith('.')) {
    return false;
  }
  return true;
}
