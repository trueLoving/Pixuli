/**
 * Pixuli 局域网转移包（只读导出 → 本机导入）。
 * zip 内含 pixuli-transfer.json + files/ 下原相对路径文件。
 */

export const TRANSFER_FORMAT = 'pixuli-transfer' as const;
export const TRANSFER_VERSION = 1 as const;
export const TRANSFER_MANIFEST_NAME = 'pixuli-transfer.json';
export const TRANSFER_FILES_PREFIX = 'files/';

export interface TransferPackageItem {
  /** 导出时在 Host 工作区中的相对路径 */
  relativePath: string;
  /** zip 内路径（相对包根） */
  archivePath: string;
  name: string;
  mimeType?: string;
  description?: string;
  tags?: string[];
  width?: number;
  height?: number;
  size?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TransferPackageManifest {
  format: typeof TRANSFER_FORMAT;
  version: typeof TRANSFER_VERSION;
  exportedAt: string;
  itemCount: number;
  items: TransferPackageItem[];
}

export function archivePathForRelative(relativePath: string): string {
  const normalized = relativePath.replace(/^[/\\]+/, '').replace(/\\/g, '/');
  return `${TRANSFER_FILES_PREFIX}${normalized}`;
}

export function buildTransferManifest(
  items: Omit<TransferPackageItem, 'archivePath'>[],
  exportedAt = new Date().toISOString(),
): TransferPackageManifest {
  const withArchive: TransferPackageItem[] = items.map(item => ({
    ...item,
    archivePath: archivePathForRelative(item.relativePath),
  }));
  return {
    format: TRANSFER_FORMAT,
    version: TRANSFER_VERSION,
    exportedAt,
    itemCount: withArchive.length,
    items: withArchive,
  };
}

export function parseTransferManifest(
  raw: unknown,
): TransferPackageManifest | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  if (record.format !== TRANSFER_FORMAT) return null;
  if (record.version !== TRANSFER_VERSION) return null;
  if (!Array.isArray(record.items)) return null;

  const items: TransferPackageItem[] = [];
  for (const entry of record.items) {
    if (!entry || typeof entry !== 'object') continue;
    const item = entry as Record<string, unknown>;
    if (typeof item.relativePath !== 'string' || !item.relativePath.trim()) {
      continue;
    }
    if (typeof item.name !== 'string' || !item.name.trim()) continue;
    const relativePath = item.relativePath
      .replace(/\\/g, '/')
      .replace(/^\/+/, '');
    const archivePath =
      typeof item.archivePath === 'string' && item.archivePath.trim()
        ? item.archivePath.replace(/\\/g, '/')
        : archivePathForRelative(relativePath);
    items.push({
      relativePath,
      archivePath,
      name: item.name,
      mimeType: typeof item.mimeType === 'string' ? item.mimeType : undefined,
      description:
        typeof item.description === 'string' ? item.description : undefined,
      tags: Array.isArray(item.tags)
        ? item.tags.filter((t): t is string => typeof t === 'string')
        : undefined,
      width: typeof item.width === 'number' ? item.width : undefined,
      height: typeof item.height === 'number' ? item.height : undefined,
      size: typeof item.size === 'number' ? item.size : undefined,
      createdAt:
        typeof item.createdAt === 'string' ? item.createdAt : undefined,
      updatedAt:
        typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
    });
  }

  if (items.length === 0) return null;

  return {
    format: TRANSFER_FORMAT,
    version: TRANSFER_VERSION,
    exportedAt:
      typeof record.exportedAt === 'string'
        ? record.exportedAt
        : new Date().toISOString(),
    itemCount: items.length,
    items,
  };
}

/** 导入时：目标文件夹 + 条目原相对路径 → 工作区目标路径 */
export function resolveImportTargetPath(
  targetFolder: string,
  itemRelativePath: string,
): string {
  const folder = targetFolder.replace(/^[/\\]+/, '').replace(/\/+$/, '');
  const rel = itemRelativePath.replace(/^[/\\]+/, '').replace(/\\/g, '/');
  return folder ? `${folder}/${rel}` : rel;
}

export function buildTransferZipFilename(count: number): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `pixuli-transfer-${count}-${stamp}.zip`;
}
