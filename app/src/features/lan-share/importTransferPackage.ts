import { unzipSync } from 'fflate';
import {
  getWorkspaceSyncEngine,
  getWorkspaceVault,
} from '@/features/workspace/workspaceRuntime';
import { importDirForSelectedFolder } from '@/features/workspace/workspaceLocalFs';
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
 * 将转移包写入本机工作区指定文件夹（保留包内相对路径结构）。
 * 目标已存在同名文件时跳过。
 */
export async function importTransferPackageToFolder(
  preview: TransferImportPreview,
  targetFolder: string,
): Promise<TransferImportResult> {
  const vault = getWorkspaceVault();
  const sync = getWorkspaceSyncEngine();
  const base = importDirForSelectedFolder(targetFolder);
  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of preview.manifest.items) {
    try {
      const targetPath = resolveImportTargetPath(base, item.relativePath);
      const existing = await vault.getByPath(targetPath);
      if (existing && !existing.deletedAt) {
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

  return { imported, skipped, failed };
}
