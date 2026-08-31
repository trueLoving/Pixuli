/** 本地工作区路径，永不同步（D3） */
export const SYNC_EXCLUDED_DIR = '.pixuli';

export function normalizeConfigRoot(configRoot: string): string {
  return configRoot.replace(/^\/+/, '').replace(/\/+$/, '');
}

export function joinConfigRoot(
  configRoot: string,
  relativePath: string,
): string {
  const root = normalizeConfigRoot(configRoot);
  const rel = relativePath.replace(/^\/+/, '').replace(/\\/g, '/');
  if (!root) {
    return rel;
  }
  if (!rel) {
    return root;
  }
  return `${root}/${rel}`.replace(/\/+/g, '/');
}

export function isSyncExcludedPath(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/');
  return (
    normalized === SYNC_EXCLUDED_DIR ||
    normalized.startsWith(`${SYNC_EXCLUDED_DIR}/`)
  );
}

/** 工作区相对路径；`.pixuli` 下返回 null */
export function resolveRemotePathForPush(entry: {
  relativePath: string;
  remotePath?: string;
}): string | null {
  if (isSyncExcludedPath(entry.relativePath)) {
    return null;
  }
  return entry.remotePath ?? entry.relativePath.replace(/\\/g, '/');
}

/** configRoot 模型：远端相对路径即本地相对路径 */
export function resolveLocalPathForPull(remotePath: string): string {
  return remotePath.replace(/^\/+/, '').replace(/\\/g, '/');
}
