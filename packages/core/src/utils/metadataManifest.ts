import type { ImageCaptureMetadata } from '../types/imageCapture';

export const METADATA_DIR = '.metadata';
export const MANIFEST_FILE = 'manifest.json';
export const MANIFEST_VERSION = 1;

export interface MetadataManifestFileEntry {
  id?: string;
  name: string;
  description?: string;
  tags?: string[];
  size?: number;
  width?: number;
  height?: number;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
  capture?: ImageCaptureMetadata;
}

export interface MetadataManifest {
  version: typeof MANIFEST_VERSION;
  files: Record<string, MetadataManifestFileEntry>;
}

export function createEmptyManifest(): MetadataManifest {
  return { version: MANIFEST_VERSION, files: {} };
}

export function parseMetadataManifest(raw: unknown): MetadataManifest | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const record = raw as Record<string, unknown>;
  if (record.version !== MANIFEST_VERSION || typeof record.files !== 'object') {
    return null;
  }
  return {
    version: MANIFEST_VERSION,
    files: { ...(record.files as Record<string, MetadataManifestFileEntry>) },
  };
}

export function dirnameRelative(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/');
  const slash = normalized.lastIndexOf('/');
  return slash === -1 ? '' : normalized.slice(0, slash);
}

export function basenameRelative(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/');
  const slash = normalized.lastIndexOf('/');
  return slash === -1 ? normalized : normalized.slice(slash + 1);
}

export function getDirManifestRelativePath(dirPath: string): string {
  const dir = dirPath.replace(/\\/g, '/').replace(/\/+$/, '');
  if (!dir) {
    return `${METADATA_DIR}/${MANIFEST_FILE}`;
  }
  return `${dir}/${METADATA_DIR}/${MANIFEST_FILE}`;
}

/** 资源所在目录的 manifest 路径（工作区相对） */
export function getManifestRelativePath(assetStoragePath: string): string {
  return getDirManifestRelativePath(dirnameRelative(assetStoragePath));
}

export function upsertManifestEntry(
  manifest: MetadataManifest,
  fileName: string,
  entry: MetadataManifestFileEntry,
): MetadataManifest {
  return {
    ...manifest,
    files: {
      ...manifest.files,
      [fileName]: entry,
    },
  };
}

export function removeManifestEntry(
  manifest: MetadataManifest,
  fileName: string,
): MetadataManifest {
  const next = { ...manifest.files };
  delete next[fileName];
  return { ...manifest, files: next };
}

export function getManifestEntry(
  manifest: MetadataManifest | null | undefined,
  fileName: string,
): MetadataManifestFileEntry | null {
  if (!manifest) {
    return null;
  }
  return manifest.files[fileName] ?? null;
}

export function manifestEntryFromImageFields(
  fields: Partial<MetadataManifestFileEntry> & { name: string },
): MetadataManifestFileEntry {
  return {
    id: fields.id,
    name: fields.name,
    description: fields.description ?? '',
    tags: fields.tags ?? [],
    size: fields.size ?? 0,
    width: fields.width ?? 0,
    height: fields.height ?? 0,
    type: fields.type,
    createdAt: fields.createdAt,
    updatedAt: fields.updatedAt,
    capture: fields.capture,
  };
}

export function manifestEntryToRecord(
  entry: MetadataManifestFileEntry,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: entry.id,
    name: entry.name,
    description: entry.description ?? '',
    tags: entry.tags ?? [],
    size: entry.size ?? 0,
    width: entry.width ?? 0,
    height: entry.height ?? 0,
    updatedAt: entry.updatedAt,
    createdAt: entry.createdAt,
  };
  if (entry.type) {
    payload.type = entry.type;
  }
  if (entry.capture) {
    payload.capture = entry.capture;
  }
  return payload;
}

export function parseManifestEntryRecord(
  raw: unknown,
): MetadataManifestFileEntry | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const record = raw as Record<string, unknown>;
  if (typeof record.name !== 'string') {
    return null;
  }
  return manifestEntryFromImageFields({
    id: typeof record.id === 'string' ? record.id : undefined,
    name: record.name,
    description:
      typeof record.description === 'string' ? record.description : '',
    tags: Array.isArray(record.tags)
      ? record.tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
    size: typeof record.size === 'number' ? record.size : 0,
    width: typeof record.width === 'number' ? record.width : 0,
    height: typeof record.height === 'number' ? record.height : 0,
    type: typeof record.type === 'string' ? record.type : undefined,
    createdAt:
      typeof record.createdAt === 'string' ? record.createdAt : undefined,
    updatedAt:
      typeof record.updatedAt === 'string' ? record.updatedAt : undefined,
    capture:
      record.capture && typeof record.capture === 'object'
        ? (record.capture as MetadataManifestFileEntry['capture'])
        : undefined,
  });
}
