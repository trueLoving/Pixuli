/**
 * 局域网共享列表 / 导出展开：以 Vault 索引为库视图（与 Desktop 一致），
 * 不以磁盘 readdir 为准。
 */

import { matchesListPathPrefix } from '@pixuli/core/vault';
import { buildWorkspaceFolderTree } from '../workspace/folderTree';
import {
  isHiddenRelativePath,
  normalizeRelativePath,
  sanitizeShareRelativePath,
} from './lanShareHelpers';

export interface VaultShareIndexEntry {
  relativePath: string;
  name: string;
  size?: number;
  mimeType?: string;
  deletedAt?: string;
}

export interface LanShareListEntry {
  name: string;
  kind: 'dir' | 'file';
  relativePath: string;
  size?: number;
  mimeType?: string;
}

function activeEntries(
  entries: VaultShareIndexEntry[],
): VaultShareIndexEntry[] {
  return entries.filter(
    entry =>
      !entry.deletedAt &&
      Boolean(entry.relativePath) &&
      !isHiddenRelativePath(entry.relativePath),
  );
}

function findFolderNode(
  path: string,
  emptyFolders: string[],
  filePaths: string[],
): { name: string; path: string }[] {
  const current = normalizeRelativePath(path);
  const tree = buildWorkspaceFolderTree(filePaths, emptyFolders);
  const walk = (
    node: ReturnType<typeof buildWorkspaceFolderTree>,
  ): typeof node | null => {
    if (node.path === current) return node;
    for (const child of node.children) {
      const found = walk(child);
      if (found) return found;
    }
    return null;
  };
  const node = current ? walk(tree) : tree;
  if (!node) return [];
  return node.children
    .filter(child => !isHiddenRelativePath(child.path))
    .map(child => ({ name: child.name, path: child.path }));
}

/** 当前目录浅层列表：子文件夹 + 本层文件（展示名用索引 name） */
export function listVaultShareDirectory(
  entries: VaultShareIndexEntry[],
  emptyFolders: string[],
  relativeDir: string,
): LanShareListEntry[] {
  const dir = normalizeRelativePath(relativeDir);
  if (dir && isHiddenRelativePath(dir)) return [];

  const active = activeEntries(entries);
  const filePaths = active.map(entry => entry.relativePath);
  const folders = emptyFolders
    .map(normalizeRelativePath)
    .filter(folder => folder && !isHiddenRelativePath(folder));

  const items: LanShareListEntry[] = [];

  for (const child of findFolderNode(dir, folders, filePaths)) {
    items.push({
      name: child.name,
      kind: 'dir',
      relativePath: child.path,
    });
  }

  for (const entry of active) {
    if (!matchesListPathPrefix(entry.relativePath, dir || undefined, true)) {
      continue;
    }
    items.push({
      name:
        entry.name || entry.relativePath.split('/').pop() || entry.relativePath,
      kind: 'file',
      relativePath: entry.relativePath,
      size: entry.size,
      mimeType: entry.mimeType,
    });
  }

  return items.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}

function isVaultFolderPath(
  relativePath: string,
  active: VaultShareIndexEntry[],
  emptyFolders: string[],
): boolean {
  const dir = normalizeRelativePath(relativePath);
  if (!dir) return true;
  if (emptyFolders.map(normalizeRelativePath).includes(dir)) return true;
  const prefix = `${dir}/`;
  return active.some(
    entry =>
      entry.relativePath === dir || entry.relativePath.startsWith(prefix),
  );
}

/**
 * 将勾选的文件/文件夹路径展开为 Vault 中的文件 relativePath。
 * 文件夹递归包含其子树全部活跃文件。
 */
export function collectVaultShareFilePaths(
  entries: VaultShareIndexEntry[],
  emptyFolders: string[],
  selectedPaths: string[],
): string[] {
  const active = activeEntries(entries);
  const byPath = new Map(active.map(entry => [entry.relativePath, entry]));
  const unique = Array.from(
    new Set(
      selectedPaths
        .map(path => sanitizeShareRelativePath(path))
        .filter((path): path is string => path != null && path !== ''),
    ),
  );

  const files = new Set<string>();
  for (const rel of unique) {
    if (byPath.has(rel)) {
      files.add(rel);
      continue;
    }
    if (!isVaultFolderPath(rel, active, emptyFolders)) continue;
    const prefix = `${rel}/`;
    for (const entry of active) {
      if (entry.relativePath === rel || entry.relativePath.startsWith(prefix)) {
        files.add(entry.relativePath);
      }
    }
  }

  return Array.from(files).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );
}

/** 从索引查找展示名（导出 manifest 优先） */
export function vaultDisplayNameForPath(
  entries: VaultShareIndexEntry[],
  relativePath: string,
): string | null {
  const hit = entries.find(
    entry => entry.relativePath === relativePath && !entry.deletedAt,
  );
  return hit?.name?.trim() || null;
}
