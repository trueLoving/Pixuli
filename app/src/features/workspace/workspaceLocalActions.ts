import type { ImageItem, ImageUploadData } from '@pixuli/core/types';
import { mapEntriesToImageItems } from '@/features/workspace/localImageMapper';
import {
  enqueuePendingPushForFolder,
  importImageToLocalVault,
} from '@/features/workspace/workspaceLocalFs';
import { refreshAndPersistRootDisplayPath } from '@/features/workspace/workspaceSetupService';
import {
  getWorkspaceSyncEngine,
  getWorkspaceVault,
  resolveSelectedProvider,
} from '@/features/workspace/workspaceRuntime';
import type {
  WorkspaceStoreGet,
  WorkspaceStoreSet,
} from '@/features/workspace/workspaceStoreTypes';
import type { SyncRunOutcome } from './syncOutcome';

export async function refreshRootDisplayPath(
  get: WorkspaceStoreGet,
  set: WorkspaceStoreSet,
): Promise<void> {
  await refreshAndPersistRootDisplayPath(get().rootPath, rootDisplayPath =>
    set({ rootDisplayPath }),
  );
}

export async function refreshLocalImages(
  get: WorkspaceStoreGet,
  set: WorkspaceStoreSet,
  options?: { quiet?: boolean },
): Promise<void> {
  if (get().mode !== 'local') {
    return;
  }

  const quiet = options?.quiet === true;
  if (!quiet) {
    set({ loading: true, error: null });
  }
  try {
    const vault = getWorkspaceVault();
    const entries = await vault.list();
    const provider = resolveSelectedProvider();
    const images = await mapEntriesToImageItems(entries, provider);
    const localFolders = await vault.listFolders();
    set({ localImages: images, localFolders, loading: false });
  } catch (error) {
    set({
      loading: false,
      error: error instanceof Error ? error.message : '加载本地图片失败',
    });
  }
}

export async function refreshLocalFolders(
  get: WorkspaceStoreGet,
  set: WorkspaceStoreSet,
): Promise<void> {
  if (get().mode !== 'local') {
    return;
  }
  try {
    const localFolders = await getWorkspaceVault().listFolders();
    set({ localFolders });
  } catch (error) {
    set({
      error: error instanceof Error ? error.message : '加载文件夹失败',
    });
  }
}

export async function createLocalFolder(
  get: WorkspaceStoreGet,
  set: WorkspaceStoreSet,
  relativeDir: string,
): Promise<void> {
  if (get().mode !== 'local') {
    return;
  }
  set({ loading: true, error: null });
  try {
    await getWorkspaceVault().createFolder(relativeDir);
    await get().refreshLocalFolders();
    set({ loading: false, syncMessage: '已新建文件夹（仅本机）' });
  } catch (error) {
    set({
      loading: false,
      error: error instanceof Error ? error.message : '新建文件夹失败',
    });
  }
}

export async function renameLocalFolder(
  get: WorkspaceStoreGet,
  set: WorkspaceStoreSet,
  fromDir: string,
  toDir: string,
): Promise<void> {
  if (get().mode !== 'local') {
    return;
  }
  set({ loading: true, error: null });
  try {
    const moved = await getWorkspaceVault().renameFolder(fromDir, toDir);
    void moved;
    await enqueuePendingPushForFolder(getWorkspaceVault(), toDir, 'upload');
    await get().refreshLocalImages();
    await get().refreshSyncStatus();
    set({ loading: false, syncMessage: '已重命名文件夹（仅本机）' });
  } catch (error) {
    set({
      loading: false,
      error: error instanceof Error ? error.message : '重命名文件夹失败',
    });
  }
}

export async function deleteLocalFolder(
  get: WorkspaceStoreGet,
  set: WorkspaceStoreSet,
  relativeDir: string,
): Promise<number> {
  if (get().mode !== 'local') {
    return 0;
  }
  set({ loading: true, error: null });
  try {
    const count = await getWorkspaceVault().deleteFolder(relativeDir);
    await enqueuePendingPushForFolder(
      getWorkspaceVault(),
      relativeDir,
      'delete',
    );
    await get().refreshLocalImages();
    await get().refreshSyncStatus();
    set({ loading: false, syncMessage: '已删除文件夹（仅本机）' });
    return count;
  } catch (error) {
    set({
      loading: false,
      error: error instanceof Error ? error.message : '删除文件夹失败',
    });
    return 0;
  }
}

export async function moveLocalFile(
  get: WorkspaceStoreGet,
  set: WorkspaceStoreSet,
  relativePath: string,
  targetDir: string,
): Promise<void> {
  if (get().mode !== 'local') {
    return;
  }
  set({ loading: true, error: null });
  try {
    const entry = await getWorkspaceVault().moveFile(relativePath, targetDir);
    await getWorkspaceSyncEngine().enqueuePush({
      type: 'upload',
      relativePath: entry.relativePath,
    });
    await get().refreshLocalImages();
    await get().refreshSyncStatus();
    set({ loading: false, syncMessage: '已移动文件（仅本机）' });
  } catch (error) {
    set({
      loading: false,
      error: error instanceof Error ? error.message : '移动文件失败',
    });
  }
}

export async function scanWorkspace(
  get: WorkspaceStoreGet,
  set: WorkspaceStoreSet,
): Promise<void> {
  if (get().mode !== 'local') {
    return;
  }
  set({ loading: true, error: null });
  try {
    const added = await getWorkspaceVault().scan();
    await get().refreshLocalImages();
    await get().refreshSyncStatus();
    const outcome: SyncRunOutcome =
      added > 0
        ? {
            kind: 'success',
            parts: [{ key: 'workspace.rescanAdded', params: { count: added } }],
          }
        : { kind: 'info', parts: [{ key: 'workspace.rescanUpToDate' }] };
    set({
      loading: false,
      syncOutcome: outcome,
      syncMessage: null,
    });
  } catch (error) {
    set({
      loading: false,
      syncOutcome: {
        kind: 'error',
        parts: [{ key: 'workspace.rescanFailed' }],
        rawMessage: error instanceof Error ? error.message : undefined,
      },
    });
  }
}

export async function importLocalImage(
  get: WorkspaceStoreGet,
  set: WorkspaceStoreSet,
  uploadData: ImageUploadData,
): Promise<ImageItem | null> {
  if (get().mode !== 'local') {
    set({ error: '请先选择本地工作区' });
    return null;
  }

  set({ error: null });
  try {
    const targetPath = await importImageToLocalVault(uploadData);
    await get().refreshLocalImages({ quiet: true });
    await get().refreshSyncStatus();
    set({ syncMessage: '已保存到本地工作区' });
    return (
      get().localImages.find(image => image.localPath === targetPath) ?? null
    );
  } catch (error) {
    set({
      error: error instanceof Error ? error.message : '保存到本地工作区失败',
    });
    throw error;
  }
}

export async function updateLocalMetadata(
  get: WorkspaceStoreGet,
  set: WorkspaceStoreSet,
  relativePath: string,
  patch: { name?: string; tags?: string[]; description?: string },
): Promise<void> {
  if (get().mode !== 'local') {
    return;
  }
  set({ loading: true, error: null });
  try {
    await getWorkspaceVault().updateMetadata(relativePath, patch);
    await getWorkspaceSyncEngine().enqueuePush({
      type: 'metadata',
      relativePath,
    });
    await get().refreshLocalImages();
    await get().refreshSyncStatus();
    set({ loading: false });
  } catch (error) {
    set({
      loading: false,
      error: error instanceof Error ? error.message : '更新元数据失败',
    });
    throw error;
  }
}

export async function softDeleteLocal(
  get: WorkspaceStoreGet,
  set: WorkspaceStoreSet,
  relativePath: string,
): Promise<void> {
  if (get().mode !== 'local') {
    return;
  }
  set({ loading: true, error: null });
  try {
    await getWorkspaceVault().softDelete(relativePath);
    await getWorkspaceSyncEngine().enqueuePush({
      type: 'delete',
      relativePath,
    });
    await get().refreshLocalImages();
    await get().refreshSyncStatus();
    set({ loading: false });
  } catch (error) {
    set({
      loading: false,
      error: error instanceof Error ? error.message : '删除失败',
    });
  }
}
