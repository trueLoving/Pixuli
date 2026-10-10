import { DefaultPlatformAdapter } from '@pixuli/core/platform';
import type { ImageUploadData } from '@pixuli/core/types';
import { getUploadFileName } from '@pixuli/core/types';
import { guessMimeType, type LocalVault } from '@pixuli/core/vault';
import {
  getWorkspaceSyncEngine,
  getWorkspaceVault,
} from '@/features/workspace/workspaceRuntime';

export function sanitizeWorkspaceFileName(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '_');
}

/** 上传目录只跟当前选中文件夹走；「全部」时落到 images。 */
export function importDirForSelectedFolder(selectedFolderPath: string): string {
  if (!selectedFolderPath || selectedFolderPath === '__root__') {
    return 'images';
  }
  return selectedFolderPath.replace(/\/+$/, '');
}

export async function resolveImportTargetDir(): Promise<string> {
  const { useUIStore } = await import('@/stores/uiStore');
  return importDirForSelectedFolder(useUIStore.getState().selectedFolderPath);
}

export async function importImageToLocalVault(
  uploadData: ImageUploadData,
): Promise<string> {
  const fileName = sanitizeWorkspaceFileName(
    getUploadFileName(uploadData.file, uploadData.name),
  );
  const targetDir = await resolveImportTargetDir();
  const targetPath = `${targetDir.replace(/\/+$/, '')}/${Date.now()}-${fileName}`;
  const vault = getWorkspaceVault();
  const mimeType =
    typeof uploadData.file === 'string'
      ? guessMimeType(fileName)
      : uploadData.file.type || guessMimeType(fileName);

  let width = 0;
  let height = 0;
  if (mimeType.startsWith('image/')) {
    try {
      const platform = new DefaultPlatformAdapter();
      const dimensions = await platform.getImageDimensions(uploadData.file);
      width = dimensions.width;
      height = dimensions.height;
    } catch {
      width = 0;
      height = 0;
    }
  }

  await vault.importFile(uploadData.file, targetPath, {
    name: uploadData.name ?? fileName,
    tags: uploadData.tags ?? [],
    description: uploadData.description,
    mimeType,
    width,
    height,
    syncState: 'local-only',
    createdAt: uploadData.captureMetadata?.takenAt,
    captureMetadata: uploadData.captureMetadata,
  });

  await getWorkspaceSyncEngine().enqueuePush({
    type: 'upload',
    relativePath: targetPath,
  });

  return targetPath;
}

export async function enqueuePendingPushForFolder(
  vault: LocalVault,
  folderPath: string,
  mode: 'upload' | 'delete',
): Promise<void> {
  const entries = await vault.list(
    mode === 'delete' ? { includeDeleted: true } : undefined,
  );
  const sync = getWorkspaceSyncEngine();
  for (const entry of entries) {
    const inFolder =
      entry.relativePath === folderPath ||
      entry.relativePath.startsWith(`${folderPath}/`);
    if (!inFolder) {
      continue;
    }
    if (mode === 'delete' && entry.deletedAt) {
      await sync.enqueuePush({
        type: 'delete',
        relativePath: entry.relativePath,
      });
    }
    if (
      mode === 'upload' &&
      entry.syncState === 'pending-push' &&
      (entry.relativePath === folderPath ||
        entry.relativePath.startsWith(`${folderPath}/`))
    ) {
      await sync.enqueuePush({
        type: 'upload',
        relativePath: entry.relativePath,
      });
    }
  }
}
