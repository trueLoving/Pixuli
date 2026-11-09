import { WORKSPACE_PATHS } from './paths';
import {
  writeConflicts,
  writePushQueue,
  type BindingSyncStateRecord,
} from './syncPersistence';
import type {
  LocalImageIndexEntry,
  LocalVault,
  WorkspaceAdapter,
} from './types';
import { decodeJson, encodeJson, nowIso } from './utils';

const CHECKPOINT_SCHEMA_VERSION = 1;

export interface SyncCheckpointMeta {
  schemaVersion: number;
  createdAt: string;
  bindingId?: string;
  treeRevision: string | null;
  fileCount: number;
  folderCount: number;
}

export interface SyncCheckpointIndexFile {
  schemaVersion: number;
  entries: LocalImageIndexEntry[];
  folders: string[];
}

export interface CreateSyncCheckpointOptions {
  bindingId?: string;
  treeRevision?: string | null;
}

async function clearDirRecursive(
  adapter: WorkspaceAdapter,
  relativeDir: string,
): Promise<void> {
  if (!(await adapter.exists(relativeDir))) {
    return;
  }
  const files = await adapter.listFiles(relativeDir, { recursive: true });
  for (const relativePath of files) {
    await adapter.deleteFile(relativePath);
  }
}

function checkpointFilePath(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  return `${WORKSPACE_PATHS.checkpointLatestFiles}/${normalized}`;
}

/** 读取最近一次同步检查点元数据；不存在则 null */
export async function readLatestCheckpointMeta(
  adapter: WorkspaceAdapter,
): Promise<SyncCheckpointMeta | null> {
  if (!(await adapter.exists(WORKSPACE_PATHS.checkpointLatestMeta))) {
    return null;
  }
  try {
    const raw = await adapter.readFile(WORKSPACE_PATHS.checkpointLatestMeta);
    const parsed = decodeJson<SyncCheckpointMeta>(raw);
    if (!parsed?.createdAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * 同步成功后写入本地检查点（仅保留 latest）。
 * 快照当前未删除条目与文件字节，供本机恢复；永不同步远端。
 */
export async function writeLatestSyncCheckpoint(
  vault: LocalVault,
  options?: CreateSyncCheckpointOptions,
): Promise<SyncCheckpointMeta> {
  const adapter = vault.adapter;
  const entries = (await vault.list()).map(entry => ({ ...entry }));
  const folders = await vault.listFolders();

  await clearDirRecursive(adapter, WORKSPACE_PATHS.checkpointLatest);

  for (const entry of entries) {
    if (!(await adapter.exists(entry.relativePath))) {
      continue;
    }
    const bytes = await adapter.readFile(entry.relativePath);
    await adapter.writeFile(checkpointFilePath(entry.relativePath), bytes);
  }

  const indexFile: SyncCheckpointIndexFile = {
    schemaVersion: CHECKPOINT_SCHEMA_VERSION,
    entries,
    folders,
  };
  await adapter.writeFile(
    WORKSPACE_PATHS.checkpointLatestIndex,
    encodeJson(indexFile),
  );

  const meta: SyncCheckpointMeta = {
    schemaVersion: CHECKPOINT_SCHEMA_VERSION,
    createdAt: nowIso(),
    bindingId: options?.bindingId,
    treeRevision: options?.treeRevision ?? null,
    fileCount: entries.length,
    folderCount: folders.length,
  };
  await adapter.writeFile(
    WORKSPACE_PATHS.checkpointLatestMeta,
    encodeJson(meta),
  );
  return meta;
}

export interface RestoreCheckpointResult {
  restored: number;
  removed: number;
}

/**
 * 将工作区恢复为最近一次同步检查点（整库时间点）。
 * 覆盖/补回检查点内文件，删除检查点之后的仅本地新增，并清空推送队列。
 */
export async function restoreLatestSyncCheckpoint(
  vault: LocalVault,
): Promise<RestoreCheckpointResult> {
  const adapter = vault.adapter;
  if (!(await adapter.exists(WORKSPACE_PATHS.checkpointLatestIndex))) {
    throw new Error('No local sync checkpoint');
  }

  const indexRaw = await adapter.readFile(
    WORKSPACE_PATHS.checkpointLatestIndex,
  );
  const snapshot = decodeJson<SyncCheckpointIndexFile>(indexRaw);
  const checkpointEntries = snapshot.entries ?? [];
  const checkpointFolders = snapshot.folders ?? [];
  const checkpointPaths = new Set(
    checkpointEntries.map(entry => entry.relativePath),
  );

  let removed = 0;
  const current = await vault.list({ includeDeleted: true });
  for (const entry of current) {
    if (checkpointPaths.has(entry.relativePath)) {
      continue;
    }
    await vault.removeEntry(entry.relativePath);
    removed += 1;
  }

  let restored = 0;
  for (const entry of checkpointEntries) {
    const blobPath = checkpointFilePath(entry.relativePath);
    if (!(await adapter.exists(blobPath))) {
      continue;
    }
    const bytes = await adapter.readFile(blobPath);
    await adapter.writeFile(entry.relativePath, bytes);
    await vault.importFile(entry.relativePath, entry.relativePath, {
      ...entry,
      syncState: 'synced',
      deletedAt: undefined,
    });
    restored += 1;
  }

  const existingFolders = new Set(await vault.listFolders());
  for (const folder of checkpointFolders) {
    if (!folder || existingFolders.has(folder)) continue;
    await vault.createFolder(folder);
    existingFolders.add(folder);
  }

  const remainingFolders = await vault.listFolders();
  const needed = new Set(checkpointFolders);
  for (const entry of checkpointEntries) {
    const parts = entry.relativePath.replace(/\\/g, '/').split('/');
    let accumulated = '';
    for (let index = 0; index < parts.length - 1; index += 1) {
      const segment = parts[index];
      if (!segment) continue;
      accumulated = accumulated ? `${accumulated}/${segment}` : segment;
      needed.add(accumulated);
    }
  }
  for (const folder of [...remainingFolders].sort(
    (a, b) => b.length - a.length,
  )) {
    if (needed.has(folder)) continue;
    await vault.deleteFolder(folder);
  }

  await writePushQueue(adapter, []);
  await writeConflicts(adapter, []);

  return { restored, removed };
}

export async function deleteLatestSyncCheckpoint(
  adapter: WorkspaceAdapter,
): Promise<void> {
  await clearDirRecursive(adapter, WORKSPACE_PATHS.checkpointLatest);
}

/** 供同步成功后写入检查点时带上 treeRevision */
export function treeRevisionFromBindingState(
  state: BindingSyncStateRecord | null | undefined,
): string | null {
  return state?.treeRevision ?? state?.cursor ?? null;
}
