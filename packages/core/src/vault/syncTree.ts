import { nowIso } from './utils';

/** 远端目录树摘要（挂在 configRoot 下，不上 .pixuli） */
export const SYNC_TREE_RELATIVE_PATH = '.metadata/sync-tree.json';

export const SYNC_TREE_VERSION = 1 as const;

export interface SyncFolderStamp {
  revision: string;
  updatedAt: string;
}

export interface SyncTreeFile {
  version: typeof SYNC_TREE_VERSION;
  revision: string;
  updatedAt: string;
  /** 键为工作区相对目录；`""` 表示根层 */
  folders: Record<string, SyncFolderStamp>;
}

export function normalizeFolderKey(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
}

export function folderKeyFromFilePath(relativePath: string): string {
  const normalized = normalizeFolderKey(relativePath);
  if (!normalized) {
    return '';
  }
  const slash = normalized.lastIndexOf('/');
  return slash < 0 ? '' : normalized.slice(0, slash);
}

/**
 * 该目录以及每一层祖先，含根 `""`。
 * `images/trip` → `images/trip`、`images`、`""`。
 * 只含子文件夹的中间层也必须有戳，否则进父目录不会拉这一层，子文件夹对不上。
 */
export function folderKeyAndAncestors(folderKey: string): string[] {
  const key = normalizeFolderKey(folderKey);
  if (!key) {
    return [''];
  }
  const parts = key.split('/');
  const keys: string[] = [];
  for (let index = parts.length; index >= 1; index -= 1) {
    keys.push(parts.slice(0, index).join('/'));
  }
  keys.push('');
  return keys;
}

export function createEmptySyncTree(updatedAt = nowIso()): SyncTreeFile {
  return {
    version: SYNC_TREE_VERSION,
    revision: updatedAt,
    updatedAt,
    folders: {
      '': { revision: updatedAt, updatedAt },
    },
  };
}

export function parseSyncTree(raw: unknown): SyncTreeFile | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const record = raw as Record<string, unknown>;
  if (record.version !== SYNC_TREE_VERSION) {
    return null;
  }
  if (
    typeof record.revision !== 'string' ||
    typeof record.updatedAt !== 'string'
  ) {
    return null;
  }
  if (!record.folders || typeof record.folders !== 'object') {
    return null;
  }
  const folders: Record<string, SyncFolderStamp> = {};
  for (const [key, value] of Object.entries(
    record.folders as Record<string, unknown>,
  )) {
    if (!value || typeof value !== 'object') {
      continue;
    }
    const stamp = value as Record<string, unknown>;
    if (
      typeof stamp.revision !== 'string' ||
      typeof stamp.updatedAt !== 'string'
    ) {
      continue;
    }
    folders[normalizeFolderKey(key)] = {
      revision: stamp.revision,
      updatedAt: stamp.updatedAt,
    };
  }
  if (!folders['']) {
    folders[''] = {
      revision: record.revision,
      updatedAt: record.updatedAt,
    };
  }
  return {
    version: SYNC_TREE_VERSION,
    revision: record.revision,
    updatedAt: record.updatedAt,
    folders,
  };
}

export function bumpRevision(at = nowIso()): string {
  return at;
}

/** 根据文件路径集合构建/刷新 tree（revision 统一为同一时刻） */
export function buildSyncTreeFromPaths(
  filePaths: string[],
  folderKeys: string[] = [],
  at = nowIso(),
): SyncTreeFile {
  const folders = new Set<string>(['']);
  for (const path of filePaths) {
    for (const key of folderKeyAndAncestors(folderKeyFromFilePath(path))) {
      folders.add(key);
    }
  }
  for (const key of folderKeys) {
    for (const ancestor of folderKeyAndAncestors(key)) {
      folders.add(ancestor);
    }
  }
  const tree = createEmptySyncTree(at);
  tree.revision = at;
  tree.updatedAt = at;
  tree.folders = {};
  for (const key of [...folders].sort()) {
    tree.folders[key] = { revision: at, updatedAt: at };
  }
  return tree;
}

export function listDirtyFolderKeys(
  remote: SyncTreeFile,
  localFolders: Record<string, { revision: string | null; dirty?: boolean }>,
  localTreeRevision: string | null,
): string[] {
  const dirty = new Set<string>();
  const treeMatches = Boolean(
    localTreeRevision && localTreeRevision === remote.revision,
  );
  if (!treeMatches) {
    for (const [key, remoteStamp] of Object.entries(remote.folders)) {
      const local = localFolders[key];
      if (!local || local.dirty || local.revision !== remoteStamp.revision) {
        dirty.add(key);
      }
    }
  }
  for (const [key, local] of Object.entries(localFolders)) {
    if (local.dirty) {
      dirty.add(key);
    }
  }
  for (const key of missingAncestorKeys(remote, localFolders)) {
    dirty.add(key);
  }
  return [...dirty].sort();
}

/** 远端树缺中间层时，本地还没有干净戳的祖先也要拉一次，才能列出子文件夹。 */
function missingAncestorKeys(
  remote: SyncTreeFile,
  localFolders: Record<string, { revision: string | null; dirty?: boolean }>,
): string[] {
  const missing: string[] = [];
  for (const key of Object.keys(remote.folders)) {
    for (const ancestor of folderKeyAndAncestors(key)) {
      if (remote.folders[ancestor]) {
        continue;
      }
      const local = localFolders[ancestor];
      if (!local || local.dirty || !local.revision) {
        missing.push(ancestor);
      }
    }
  }
  return missing;
}

export function touchFolderInTree(
  tree: SyncTreeFile,
  folderKey: string,
  at = nowIso(),
): SyncTreeFile {
  const folders = { ...tree.folders };
  for (const key of folderKeyAndAncestors(folderKey)) {
    folders[key] = { revision: at, updatedAt: at };
  }
  return {
    ...tree,
    revision: at,
    updatedAt: at,
    folders,
  };
}
