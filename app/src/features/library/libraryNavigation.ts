import {
  buildWorkspaceFolderTree,
  type WorkspaceFolderNode,
} from '@/features/workspace/folderTree';

export interface LibraryBreadcrumbSegment {
  name: string;
  path: string;
}

export interface LibraryChildFolder {
  name: string;
  path: string;
}

/** 空字符串与 `__root__` 都表示工作区根。 */
export function normalizeLibraryFolderPath(
  path: string | null | undefined,
): string {
  const trimmed = (path ?? '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '');
  if (!trimmed || trimmed === '__root__') return '';
  return trimmed;
}

export function parentLibraryFolderPath(path: string): string {
  const current = normalizeLibraryFolderPath(path);
  const slash = current.lastIndexOf('/');
  return slash === -1 ? '' : current.slice(0, slash);
}

export function libraryBreadcrumbSegments(
  path: string,
  rootLabel: string,
): LibraryBreadcrumbSegment[] {
  const current = normalizeLibraryFolderPath(path);
  const segments: LibraryBreadcrumbSegment[] = [{ name: rootLabel, path: '' }];
  if (!current) return segments;
  let accumulated = '';
  for (const part of current.split('/')) {
    if (!part) continue;
    accumulated = accumulated ? `${accumulated}/${part}` : part;
    segments.push({ name: part, path: accumulated });
  }
  return segments;
}

function findFolderNode(
  node: WorkspaceFolderNode,
  path: string,
): WorkspaceFolderNode | null {
  if (node.path === path) return node;
  for (const child of node.children) {
    const found = findFolderNode(child, path);
    if (found) return found;
  }
  return null;
}

/** 当前文件夹的直接子文件夹。路径来自索引文件与显式空文件夹。 */
export function libraryChildFolders(
  relativePaths: string[],
  emptyFolders: string[],
  currentPath: string,
): LibraryChildFolder[] {
  const current = normalizeLibraryFolderPath(currentPath);
  const tree = buildWorkspaceFolderTree(relativePaths, emptyFolders);
  const node = current ? findFolderNode(tree, current) : tree;
  if (!node) return [];
  return node.children.map(child => ({ name: child.name, path: child.path }));
}
