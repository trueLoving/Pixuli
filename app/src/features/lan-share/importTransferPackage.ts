import { unzipSync } from 'fflate';
import {
  getWorkspaceSyncEngine,
  getWorkspaceVault,
} from '@/features/workspace/workspaceRuntime';
import { importDirForSelectedFolder } from '@/features/workspace/workspaceLocalFs';
import {
  shouldSkipExistingEntry,
  type TransferImportStrategy,
} from './importStrategy';
import {
  parseTransferManifest,
  resolveImportTargetPath,
  TRANSFER_MANIFEST_NAME,
  type TransferPackageManifest,
} from './transferPackage';

export interface TransferImportPreview {
  manifest: TransferPackageManifest;
  files: Map<string, Uint8Array>;
}

export interface TransferImportResult {
  imported: number;
  skipped: number;
  failed: number;
  /** replace 策略下先清空的本机条目数 */
  removed: number;
}

export interface TransferImportOptions {
  strategy?: TransferImportStrategy;
}

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder('utf-8').decode(bytes);
}

export async function parseTransferZipFile(
  file: File,
): Promise<TransferImportPreview> {
  const buffer = new Uint8Array(await file.arrayBuffer());
  const unzipped = unzipSync(buffer);
  const manifestBytes = unzipped[TRANSFER_MANIFEST_NAME];
  if (!manifestBytes) {
    throw new Error('missing_manifest');
  }
  const manifest = parseTransferManifest(
    JSON.parse(decodeUtf8(manifestBytes)) as unknown,
  );
  if (!manifest) {
    throw new Error('invalid_manifest');
  }

  const files = new Map<string, Uint8Array>();
  for (const item of manifest.items) {
    const bytes = unzipped[item.archivePath];
    if (!bytes) {
      throw new Error(`missing_file:${item.relativePath}`);
    }
    files.set(item.archivePath, bytes);
  }

  return { manifest, files };
}

function uint8ToFile(bytes: Uint8Array, name: string, mimeType?: string): File {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new File([copy], name, {
    type: mimeType || 'application/octet-stream',
  });
}

/**
 * 清空目标文件夹下全部活跃文件（含子目录），并入队删除同步。
 * 根目录（空路径）会清空整个工作区索引中的活跃文件。
 */
async function clearTargetFolderTree(targetFolder: string): Promise<number> {
  const vault = getWorkspaceVault();
  const sync = getWorkspaceSyncEngine();
  const base = importDirForSelectedFolder(targetFolder);
  const entries = base
    ? await vault.list({ pathPrefix: base })
    : await vault.list();

  let removed = 0;
  for (const entry of entries) {
    if (entry.deletedAt) continue;
    try {
      await vault.softDelete(entry.relativePath);
      await sync.enqueuePush({
        type: 'delete',
        relativePath: entry.relativePath,
        remotePath: entry.remotePath,
      });
      removed += 1;
    } catch {
      // 单条失败不阻断；后续导入仍可覆盖同名路径
    }
  }

  if (base) {
    try {
      // 清理空文件夹登记（已 softDelete 的条目会被跳过）
      await vault.deleteFolder(base);
    } catch {
      // 根路径或文件夹不存在时忽略
    }
  }

  return removed;
}

/**
 * 将转移包写入本机工作区指定文件夹（保留包内相对路径结构）。
 * - skip：目标已有同名活跃文件则跳过
 * - overwrite：同名则覆盖写入
 * - replace：先清空目标文件夹（含子目录）再全部写入
 */
export async function importTransferPackageToFolder(
  preview: TransferImportPreview,
  targetFolder: string,
  options: TransferImportOptions = {},
): Promise<TransferImportResult> {
  const strategy: TransferImportStrategy = options.strategy ?? 'skip';
  const vault = getWorkspaceVault();
  const sync = getWorkspaceSyncEngine();
  const base = importDirForSelectedFolder(targetFolder);
  let imported = 0;
  let skipped = 0;
  let failed = 0;
  let removed = 0;

  if (strategy === 'replace') {
    removed = await clearTargetFolderTree(targetFolder);
  }

  for (const item of preview.manifest.items) {
    try {
      const targetPath = resolveImportTargetPath(base, item.relativePath);
      const existing = await vault.getByPath(targetPath);
      const hasActive = Boolean(existing && !existing.deletedAt);
      if (shouldSkipExistingEntry(strategy, hasActive)) {
        skipped += 1;
        continue;
      }
      const bytes = preview.files.get(item.archivePath);
      if (!bytes) {
        failed += 1;
        continue;
      }
      const file = uint8ToFile(bytes, item.name, item.mimeType);
      await vault.importFile(file, targetPath, {
        name: item.name,
        description: item.description,
        tags: item.tags ?? [],
        mimeType: item.mimeType,
        width: item.width ?? 0,
        height: item.height ?? 0,
        syncState: 'local-only',
        createdAt: item.createdAt,
      });
      await sync.enqueuePush({ type: 'upload', relativePath: targetPath });
      imported += 1;
    } catch {
      failed += 1;
    }
  }

  return { imported, skipped, failed, removed };
}
