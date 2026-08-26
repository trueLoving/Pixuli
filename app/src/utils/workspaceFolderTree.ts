export interface WorkspaceFolderNode {
  /** 相对目录路径；空字符串表示全部图片 */
  path: string;
  name: string;
  imageCount: number;
  children: WorkspaceFolderNode[];
}

function dirname(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/');
  const slash = normalized.lastIndexOf('/');
  return slash === -1 ? '' : normalized.slice(0, slash);
}

function basename(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const slash = normalized.lastIndexOf('/');
  return slash === -1 ? normalized : normalized.slice(slash + 1);
}

function ensureChild(
  parent: WorkspaceFolderNode,
  path: string,
  name: string,
): WorkspaceFolderNode {
  let child = parent.children.find(node => node.path === path);
  if (!child) {
    child = { path, name, imageCount: 0, children: [] };
    parent.children.push(child);
  }
  return child;
}

/**
 * 根据图片 relativePath 与显式空文件夹构建树。
 */
export function buildWorkspaceFolderTree(
  relativePaths: string[],
  emptyFolders: string[] = [],
): WorkspaceFolderNode {
  const root: WorkspaceFolderNode = {
    path: '',
    name: '',
    imageCount: 0,
    children: [],
  };

  for (const relativePath of relativePaths) {
    if (!relativePath) continue;
    root.imageCount += 1;

    const dir = dirname(relativePath);
    if (!dir) continue;

    const segments = dir.split('/').filter(Boolean);
    let current = root;
    let accumulated = '';

    for (const segment of segments) {
      accumulated = accumulated ? `${accumulated}/${segment}` : segment;
      current = ensureChild(current, accumulated, segment);
      current.imageCount += 1;
    }
  }

  for (const folderPath of emptyFolders) {
    if (!folderPath) continue;
    const segments = folderPath.replace(/\\/g, '/').split('/').filter(Boolean);
    let current = root;
    let accumulated = '';
    for (const segment of segments) {
      accumulated = accumulated ? `${accumulated}/${segment}` : segment;
      current = ensureChild(current, accumulated, segment);
    }
  }

  const sortNodes = (nodes: WorkspaceFolderNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    for (const node of nodes) {
      sortNodes(node.children);
    }
  };
  sortNodes(root.children);

  return root;
}

/**
 * 按文件夹范围过滤。默认仅本层文件（不含子文件夹内文件）；
 * folderPath 为空表示「全部」。
 */
export function filterImagesByFolder<T extends { localPath?: string }>(
  images: T[],
  folderPath: string,
  options?: { shallow?: boolean },
): T[] {
  if (!folderPath) {
    return images;
  }
  const shallow = options?.shallow !== false;
  const prefix = `${folderPath}/`;
  return images.filter(image => {
    const path = image.localPath;
    if (!path) return false;
    if (!path.startsWith(prefix)) return false;
    if (!shallow) return true;
    const rest = path.slice(prefix.length);
    return rest.length > 0 && !rest.includes('/');
  });
}

export function folderNodeLabel(
  node: WorkspaceFolderNode,
  allLabel: string,
): string {
  if (!node.path) {
    return allLabel;
  }
  return basename(node.path);
}
