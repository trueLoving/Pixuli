import { sanitizeWorkspaceFileName } from '@/features/workspace/workspaceLocalFs';
import type { OutputMimeType } from '@/features/tools/imageProcessor';

export type ImageConvertPresetId = 'webp-80' | 'long-1600' | 'png-original';

export interface ImageConvertRequest {
  format: OutputMimeType;
  quality: number;
  /** 长边上限。不设则保持原尺寸。 */
  maxEdge?: number;
}

/** 相对原图的像素选区。 */
export interface ImageCropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const IMAGE_CONVERT_PRESETS: Record<
  ImageConvertPresetId,
  ImageConvertRequest
> = {
  'webp-80': { format: 'image/webp', quality: 0.8 },
  'long-1600': { format: 'image/webp', quality: 0.8, maxEdge: 1600 },
  'png-original': { format: 'image/png', quality: 1 },
};

const EXTENSION_BY_FORMAT: Record<OutputMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function convertedFileName(
  sourceName: string,
  format: OutputMimeType,
): string {
  const ext = EXTENSION_BY_FORMAT[format];
  const base = sourceName.replace(/\.[^/.]+$/, '').trim() || 'image';
  return sanitizeWorkspaceFileName(`${base}.${ext}`);
}

function sourceExtension(sourceName: string): string {
  const match = /\.([^/.]+)$/.exec(sourceName.trim());
  const ext = match?.[1]?.toLowerCase() ?? '';
  if (ext === 'jpeg') return 'jpg';
  if (ext === 'jpg' || ext === 'png' || ext === 'webp') return ext;
  return 'png';
}

export function croppedFileName(
  sourceName: string,
  format?: OutputMimeType,
): string {
  const ext = format
    ? EXTENSION_BY_FORMAT[format]
    : sourceExtension(sourceName);
  const base = sourceName.replace(/\.[^/.]+$/, '').trim() || 'image';
  return sanitizeWorkspaceFileName(`${base}-crop.${ext}`);
}

export function cropOutputMime(name: string, type?: string): OutputMimeType {
  if (type === 'image/jpeg' || type === 'image/png' || type === 'image/webp') {
    return type;
  }
  const ext = sourceExtension(name);
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'jpg') return 'image/jpeg';
  return 'image/png';
}

export function parentDirOfRelativePath(path: string): string {
  const normalized = path.replace(/\\/g, '/').replace(/\/+$/, '');
  const slash = normalized.lastIndexOf('/');
  return slash === -1 ? '' : normalized.slice(0, slash);
}

export function uniqueRelativePath(
  dir: string,
  fileName: string,
  taken: Set<string>,
): string {
  const safe = sanitizeWorkspaceFileName(fileName);
  const join = (name: string) => (dir ? `${dir}/${name}` : name);
  const first = join(safe);
  if (!taken.has(first)) return first;

  const dot = safe.lastIndexOf('.');
  const stem = dot > 0 ? safe.slice(0, dot) : safe;
  const ext = dot > 0 ? safe.slice(dot) : '';
  let index = 2;
  let candidate = join(`${stem}-${index}${ext}`);
  while (taken.has(candidate)) {
    index += 1;
    candidate = join(`${stem}-${index}${ext}`);
  }
  return candidate;
}
