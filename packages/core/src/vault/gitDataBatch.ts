import type { ImageItem } from '../types/image';
import type { SyncPushItem } from '../plugins/types';
import { buildProviderSidecarPayload } from '../utils/imageCaptureMetadata';
import {
  basenameRelative,
  createEmptyManifest,
  dirnameRelative,
  getDirManifestRelativePath,
  getManifestEntry,
  manifestEntryFromImageFields,
  parseManifestEntryRecord,
  removeManifestEntry,
  upsertManifestEntry,
  type MetadataManifest,
} from '../utils/metadataManifest';
import { isSyncExcludedPath, normalizeConfigRoot } from './syncPath';

export interface GitDataRequest {
  method: 'GET' | 'POST' | 'PATCH';
  path: string;
  body?: unknown;
}

export interface GitDataTransport {
  request(req: GitDataRequest): Promise<unknown>;
}

export interface GitRepoRef {
  owner: string;
  repo: string;
  branch: string;
}

export interface RepoImageBlob {
  workspacePath: string;
  sha: string;
  size: number;
}

interface RepoHead {
  commitSha: string;
  treeSha: string;
}

function repoBase(repo: GitRepoRef): string {
  return `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}`;
}

function branchRef(branch: string): string {
  return branch
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
}

export function isGitNotFound(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('404') ||
    message.includes('Not Found') ||
    message.includes('does not exist')
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function readPath(value: unknown, path: string): unknown {
  let current = value;
  for (const part of path.split('.')) {
    const record = asRecord(current);
    if (!record) {
      return undefined;
    }
    current = record[part];
  }
  return current;
}

function readSha(value: unknown, paths: string[]): string | null {
  const record = Array.isArray(value) ? value[0] : value;
  for (const path of paths) {
    const found = readPath(record, path);
    if (typeof found === 'string' && found.length > 0) {
      return found;
    }
  }
  return null;
}

export function bytesToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = '';
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export function utf8ToBase64(text: string): string {
  return bytesToBase64(new TextEncoder().encode(text));
}

/** 仓库路径去掉 configRoot 后的工作区相对路径。不在挂载点下则返回 null。 */
export function workspacePathFromRepoPath(
  configRoot: string,
  repoPath: string,
): string | null {
  const root = normalizeConfigRoot(configRoot);
  const path = repoPath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!root) {
    return path;
  }
  if (path === root) {
    return '';
  }
  if (path.startsWith(`${root}/`)) {
    return path.slice(root.length + 1);
  }
  return null;
}

function applyItemToManifest(
  manifest: MetadataManifest,
  item: SyncPushItem,
  now: string,
): MetadataManifest {
  const fileName = basenameRelative(item.remotePath);
  if (item.action === 'delete') {
    return removeManifestEntry(manifest, fileName);
  }
  const existing = getManifestEntry(manifest, fileName);
  const metadata = item.metadata ?? {};
  const merged = buildProviderSidecarPayload({
    id: existing?.id,
    name: metadata.name ?? existing?.name ?? fileName,
    description: metadata.description ?? existing?.description ?? '',
    tags: metadata.tags ?? existing?.tags ?? [],
    size: metadata.size ?? existing?.size ?? 0,
    width: metadata.width ?? existing?.width ?? 0,
    height: metadata.height ?? existing?.height ?? 0,
    updatedAt: now,
    createdAt: existing?.createdAt ?? now,
    captureMetadata: metadata.captureMetadata ?? existing?.capture,
  } as ImageItem);
  const entry =
    parseManifestEntryRecord(merged) ??
    manifestEntryFromImageFields({ name: fileName });
  return upsertManifestEntry(manifest, fileName, entry);
}

async function readRepoHead(
  transport: GitDataTransport,
  repo: GitRepoRef,
): Promise<RepoHead | null> {
  try {
    const ref = await transport.request({
      method: 'GET',
      path: `${repoBase(repo)}/git/refs/heads/${branchRef(repo.branch)}`,
    });
    const commitSha = readSha(ref, ['object.sha', 'sha']);
    if (!commitSha) {
      return null;
    }
    const commit = await transport.request({
      method: 'GET',
      path: `${repoBase(repo)}/git/commits/${commitSha}`,
    });
    const treeSha = readSha(commit, ['tree.sha', 'sha']);
    if (!treeSha) {
      throw new Error('Git commit is missing a tree sha');
    }
    return { commitSha, treeSha };
  } catch (error) {
    if (isGitNotFound(error)) {
      return null;
    }
    throw error;
  }
}

async function createBlob(
  transport: GitDataTransport,
  repo: GitRepoRef,
  base64: string,
): Promise<string> {
  const created = await transport.request({
    method: 'POST',
    path: `${repoBase(repo)}/git/blobs`,
    body: { content: base64, encoding: 'base64' },
  });
  const sha = readSha(created, ['sha']);
  if (!sha) {
    throw new Error('Git blob response is missing sha');
  }
  return sha;
}

/**
 * 把一批同步项收成一次 Git 提交。
 * 仓库还没有分支（Git Data 引用 404）时返回 false，调用方改走逐文件 Contents API。
 */
export async function commitSyncPush(
  transport: GitDataTransport,
  repo: GitRepoRef,
  items: SyncPushItem[],
  options: {
    toRepoPath: (workspacePath: string) => string;
    readManifest: (dirPath: string) => Promise<MetadataManifest>;
    now?: string;
    message?: string;
  },
): Promise<boolean> {
  if (items.length === 0) {
    return true;
  }
  const head = await readRepoHead(transport, repo);
  if (!head) {
    return false;
  }

  const now = options.now ?? new Date().toISOString();
  const dirs = [
    ...new Set(items.map(item => dirnameRelative(item.remotePath))),
  ].sort();
  const original = new Map<string, MetadataManifest>();
  const next = new Map<string, MetadataManifest>();
  for (const dir of dirs) {
    const manifest = await options.readManifest(dir);
    original.set(dir, manifest);
    next.set(dir, manifest);
  }
  for (const item of items) {
    const dir = dirnameRelative(item.remotePath);
    next.set(
      dir,
      applyItemToManifest(next.get(dir) ?? createEmptyManifest(), item, now),
    );
  }

  const changes: Array<{ path: string; sha: string | null }> = [];
  for (const item of items) {
    const repoPath = options.toRepoPath(item.remotePath);
    if (item.action === 'delete') {
      changes.push({ path: repoPath, sha: null });
      continue;
    }
    if (item.action === 'metadata') {
      continue;
    }
    if (!item.file) {
      throw new Error(`Missing file bytes for ${item.remotePath}`);
    }
    const sha = await createBlob(transport, repo, bytesToBase64(item.file));
    changes.push({ path: repoPath, sha });
  }
  for (const dir of dirs) {
    const before = JSON.stringify(original.get(dir));
    const after = next.get(dir) ?? createEmptyManifest();
    if (JSON.stringify(after) === before) {
      continue;
    }
    const sha = await createBlob(
      transport,
      repo,
      utf8ToBase64(JSON.stringify(after, null, 2)),
    );
    changes.push({
      path: options.toRepoPath(getDirManifestRelativePath(dir)),
      sha,
    });
  }

  const merged = new Map<string, string | null>();
  for (const change of changes) {
    merged.set(change.path, change.sha);
  }
  if (merged.size === 0) {
    return true;
  }

  const tree = await transport.request({
    method: 'POST',
    path: `${repoBase(repo)}/git/trees`,
    body: {
      base_tree: head.treeSha,
      tree: [...merged.entries()].map(([path, sha]) => ({
        path,
        mode: '100644',
        type: 'blob',
        sha,
      })),
    },
  });
  const treeSha = readSha(tree, ['sha']);
  if (!treeSha) {
    throw new Error('Git tree response is missing sha');
  }
  const fileCount = items.filter(item => item.action !== 'metadata').length;
  const commit = await transport.request({
    method: 'POST',
    path: `${repoBase(repo)}/git/commits`,
    body: {
      message:
        options.message ??
        `Sync workspace (${fileCount} files, ${dirs.length} manifests)`,
      tree: treeSha,
      parents: [head.commitSha],
    },
  });
  const commitSha = readSha(commit, ['sha']);
  if (!commitSha) {
    throw new Error('Git commit response is missing sha');
  }
  await transport.request({
    method: 'PATCH',
    path: `${repoBase(repo)}/git/refs/heads/${branchRef(repo.branch)}`,
    body: { sha: commitSha },
  });
  return true;
}

/**
 * 一次递归树列出挂载点下的图片 blob。
 * 返回 null 表示树被截断，调用方应退回按目录列举。
 */
export async function listRepoImageBlobs(
  transport: GitDataTransport,
  repo: GitRepoRef & { configRoot: string },
  isImageName: (name: string) => boolean,
): Promise<RepoImageBlob[] | null> {
  const head = await readRepoHead(transport, repo);
  if (!head) {
    return [];
  }
  let body: unknown;
  try {
    body = await transport.request({
      method: 'GET',
      path: `${repoBase(repo)}/git/trees/${head.treeSha}?recursive=1`,
    });
  } catch (error) {
    if (isGitNotFound(error)) {
      return [];
    }
    throw error;
  }
  const record = asRecord(body);
  if (record?.truncated === true) {
    return null;
  }
  const tree = Array.isArray(record?.tree) ? record.tree : [];
  const manifestDirs = new Set<string>();
  for (const node of tree) {
    const entry = asRecord(node);
    if (!entry || entry.type !== 'blob' || typeof entry.path !== 'string') {
      continue;
    }
    const workspacePath = workspacePathFromRepoPath(
      repo.configRoot,
      entry.path,
    );
    const manifestDir = manifestDirectoryFromPath(workspacePath);
    if (manifestDir !== null) {
      manifestDirs.add(manifestDir);
    }
  }
  const images: RepoImageBlob[] = [];
  for (const node of tree) {
    const entry = asRecord(node);
    if (!entry || entry.type !== 'blob' || typeof entry.path !== 'string') {
      continue;
    }
    const workspacePath = workspacePathFromRepoPath(
      repo.configRoot,
      entry.path,
    );
    if (!workspacePath || isSyncExcludedPath(workspacePath)) {
      continue;
    }
    if (workspacePath.split('/').includes('.metadata')) {
      continue;
    }
    const name = basenameRelative(workspacePath);
    const parent = folderKeyFromWorkspacePath(workspacePath);
    if (
      !isImageName(name) &&
      !(manifestDirs.has(parent) && !name.startsWith('.'))
    ) {
      continue;
    }
    const sha = typeof entry.sha === 'string' ? entry.sha : '';
    if (!sha) {
      continue;
    }
    images.push({
      workspacePath,
      sha,
      size: typeof entry.size === 'number' ? entry.size : 0,
    });
  }
  return images;
}

function folderKeyFromWorkspacePath(workspacePath: string): string {
  const slash = workspacePath.lastIndexOf('/');
  return slash < 0 ? '' : workspacePath.slice(0, slash);
}

/** `images/text/.metadata/manifest.json` → `images/text`；不是清单则返回 null。 */
function manifestDirectoryFromPath(
  workspacePath: string | null,
): string | null {
  if (!workspacePath) {
    return null;
  }
  const marker = '/.metadata/manifest.json';
  if (workspacePath === '.metadata/manifest.json') {
    return '';
  }
  if (!workspacePath.endsWith(marker)) {
    return null;
  }
  return workspacePath.slice(0, -marker.length);
}
