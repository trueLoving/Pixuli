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
 * 根据图片 relativePath 构建文件夹树（如 images/foo/bar.jpg → images/foo）。
 */
export function buildWorkspaceFolderTree(
  relativePaths: string[],
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

  const sortNodes = (nodes: WorkspaceFolderNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    for (const node of nodes) {
      sortNodes(node.children);
    }
  };
  sortNodes(root.children);

  return root;
}

export function filterImagesByFolder<T extends { localPath?: string }>(
  images: T[],
  folderPath: string,
): T[] {
  if (!folderPath) {
    return images;
  }
  const prefix = `${folderPath}/`;
  return images.filter(image => {
    const path = image.localPath;
    if (!path) return false;
    return path.startsWith(prefix);
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
