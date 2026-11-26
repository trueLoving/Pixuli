import { isSyncableAssetName, SYNCABLE_ASSET_EXTENSIONS } from '../utils/mime';
import { matchesSyncIgnore } from './syncIgnore';

export { isSyncableAssetName, SYNCABLE_ASSET_EXTENSIONS };

/** 本地工作区路径，永不同步（D3） */
export const SYNC_EXCLUDED_DIR = '.pixuli';

export function normalizeConfigRoot(configRoot: string): string {
  return configRoot.replace(/^\/+/, '').replace(/\/+$/, '');
}

/**
 * 是否因用户忽略规则跳过同步（D5）。
 * 与 `isSyncExcludedPath`（系统 `.pixuli/`）分层。
 */
export function isUserSyncIgnored(
  relativePath: string,
  ignorePatterns: string[] | undefined,
): boolean {
  if (!ignorePatterns || ignorePatterns.length === 0) {
    return false;
  }
  return matchesSyncIgnore(relativePath, ignorePatterns);
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

/** 工作区相对路径；`.pixuli` 或用户忽略下返回 null */
export function resolveRemotePathForPush(
  entry: {
    relativePath: string;
    remotePath?: string;
  },
  options?: { ignorePatterns?: string[] },
): string | null {
  if (isSyncExcludedPath(entry.relativePath)) {
    return null;
  }
  if (isUserSyncIgnored(entry.relativePath, options?.ignorePatterns)) {
    return null;
  }
  return entry.remotePath ?? entry.relativePath.replace(/\\/g, '/');
}

/** configRoot 模型：远端相对路径即本地相对路径 */
export function resolveLocalPathForPull(remotePath: string): string {
  return remotePath.replace(/^\/+/, '').replace(/\\/g, '/');
}

/**
 * 本层要拉取的文件。默认同步扩展名始终纳入；
 * 写进该目录 manifest 的其它文件也要纳入，否则子文件夹会拉成空的。
 */
export function isPullableSyncFile(
  fileName: string,
  options?: { listedInManifest?: boolean },
): boolean {
  if (!fileName || fileName.startsWith('.')) {
    return false;
  }
  if (isSyncableAssetName(fileName)) {
    return true;
  }
  return options?.listedInManifest === true;
}
