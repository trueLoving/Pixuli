import type { OneDriveConfig } from '@pixuli/core/types';
import type { ImageItem, ImageUploadData } from '@pixuli/core/types';
import type { PlatformAdapter } from '@pixuli/core/platform';
import {
  basenameRelative,
  createEmptyManifest,
  dirnameRelative,
  getDirManifestRelativePath,
  getManifestEntry,
  manifestEntryFromImageFields,
  parseMetadataManifest,
  removeManifestEntry,
  upsertManifestEntry,
  type MetadataManifest,
  type MetadataManifestFileEntry,
} from '@pixuli/core/utils';
import type {
  ImageListOptions,
  ProviderContext,
  StorageProviderConfig,
  StorageProviderWithSync,
  SyncPullOptions,
  SyncPullResult,
  SyncPushItem,
} from '@pixuli/core/plugins';
import {
  stablePathId,
  joinConfigRoot,
  isSyncExcludedPath,
} from '@pixuli/core/vault';
import { onedriveManifest } from './manifest';
import {
  driveItemUrl,
  ONEDRIVE_SIMPLE_UPLOAD_LIMIT,
  refreshOneDriveToken,
} from './graph';

const IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.bmp',
  '.webp',
  '.svg',
];

const UPLOAD_CHUNK = 320 * 1024 * 10;

interface DriveItem {
  id?: string;
  name?: string;
  size?: number;
  file?: { mimeType?: string };
  folder?: unknown;
  deleted?: { state?: string };
  parentReference?: { path?: string };
  lastModifiedDateTime?: string;
  createdDateTime?: string;
  eTag?: string;
  '@microsoft.graph.downloadUrl'?: string;
}

interface DriveCollection {
  value?: DriveItem[];
  '@odata.nextLink'?: string;
  '@odata.deltaLink'?: string;
}

function narrowOneDriveConfig(config: StorageProviderConfig): OneDriveConfig {
  const accessToken = config.accessToken;
  const path = config.path;
  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    throw new Error('Invalid OneDrive storage provider config');
  }
  if (typeof path !== 'string') {
    throw new Error('Invalid OneDrive storage provider config');
  }
  return {
    accessToken,
    path,
    ...(typeof config.refreshToken === 'string'
      ? { refreshToken: config.refreshToken }
      : {}),
    ...(typeof config.clientId === 'string'
      ? { clientId: config.clientId }
      : {}),
    ...(typeof config.expiresAt === 'number'
      ? { expiresAt: config.expiresAt }
      : {}),
  };
}

function isImageName(name: string): boolean {
  const lower = name.toLowerCase();
  return IMAGE_EXTENSIONS.some(ext => lower.endsWith(ext));
}

function mimeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.bmp')) return 'image/bmp';
  return 'image/jpeg';
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

function isMetadataPath(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/');
  return (
    normalized === '.metadata' ||
    normalized.startsWith('.metadata/') ||
    normalized.includes('/.metadata/')
  );
}

/** parentReference.path 形如 `/drive/root:/Pixuli/images` */
export function workspacePathFromDriveItem(
  item: DriveItem,
  configRoot: string,
): string | null {
  const name = item.name ?? '';
  if (!name) return null;
  const parent = item.parentReference?.path ?? '';
  const marker = '/drive/root:';
  const index = parent.indexOf(marker);
  const parentPath =
    index === -1 ? '' : parent.slice(index + marker.length).replace(/^\/+/, '');
  const full = parentPath ? `${parentPath}/${name}` : name;
  const root = configRoot.replace(/^\/+|\/+$/g, '');
  if (!root) return full;
  if (full === root) return null;
  if (full.startsWith(`${root}/`)) return full.slice(root.length + 1);
  return null;
}

async function readUploadBytes(
  file: File | string,
  adapter: PlatformAdapter,
): Promise<Uint8Array> {
  if (typeof file !== 'string' && typeof file.arrayBuffer === 'function') {
    return new Uint8Array(await file.arrayBuffer());
  }
  const b64 = await adapter.fileToBase64(file);
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export class OneDriveStorageProvider implements StorageProviderWithSync {
  readonly manifest = onedriveManifest;
  private config: OneDriveConfig | null = null;
  private cursor: string | null = null;
  private readonly downloadUrls = new Map<string, string>();
  private readonly fetchFn: typeof fetch;
  private readonly platformAdapter: PlatformAdapter;

  constructor(ctx: ProviderContext) {
    this.platformAdapter = ctx.platformAdapter;
    this.fetchFn =
      ctx.fetch ??
      ((input: RequestInfo | URL, init?: RequestInit) =>
        globalThis.fetch(input, init));
  }

  configure(config: StorageProviderConfig): void {
    this.config = narrowOneDriveConfig(config);
  }

  private assertConfigured(): OneDriveConfig {
    if (!this.config) {
      throw new Error('OneDrive storage provider is not configured');
    }
    return this.config;
  }

  private fullPath(relativePath: string): string {
    return joinConfigRoot(this.assertConfigured().path, relativePath);
  }

  getRawUrl(path: string): string {
    this.assertConfigured();
    return this.downloadUrls.get(path.replace(/^\/+/, '')) ?? '';
  }

  buildPublicUrl(remotePath: string): string {
    return this.getRawUrl(remotePath);
  }

  resolveLinkKind(url: string): 'local' | 'remote-raw' {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      return 'remote-raw';
    }
    return 'local';
  }

  async getSyncCursor(): Promise<string | null> {
    return this.cursor;
  }

  private async ensureFreshToken(): Promise<void> {
    const config = this.assertConfigured();
    if (!config.expiresAt || !config.refreshToken || !config.clientId) return;
    if (config.expiresAt > Date.now() + 60_000) return;
    await this.refreshTokens();
  }

  private async refreshTokens(): Promise<boolean> {
    const config = this.assertConfigured();
    if (!config.clientId || !config.refreshToken) return false;
    try {
      const tokens = await refreshOneDriveToken(
        config.clientId,
        config.refreshToken,
        this.fetchFn,
      );
      this.config = {
        ...config,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? config.refreshToken,
        expiresAt: tokens.expiresAt,
      };
      return true;
    } catch {
      return false;
    }
  }

  private async graph(
    url: string,
    init: RequestInit = {},
    allowRefresh = true,
  ): Promise<Response> {
    await this.ensureFreshToken();
    const headers = new Headers(init.headers);
    headers.set(
      'Authorization',
      `Bearer ${this.assertConfigured().accessToken}`,
    );
    const response = await this.fetchFn(url, { ...init, headers });
    if (
      response.status === 401 &&
      allowRefresh &&
      (await this.refreshTokens())
    ) {
      return this.graph(url, init, false);
    }
    return response;
  }

  private async readError(
    response: Response,
    fallback: string,
  ): Promise<string> {
    const data = (await response.json().catch(() => null)) as {
      error?: { message?: string } | string;
    } | null;
    if (data && typeof data.error === 'object' && data.error?.message) {
      return data.error.message;
    }
    if (typeof data?.error === 'string') return data.error;
    return `${fallback} (${response.status})`;
  }

  private rememberDownload(relativePath: string, item: DriveItem): string {
    const url = item['@microsoft.graph.downloadUrl'] ?? '';
    if (url) this.downloadUrls.set(relativePath, url);
    return url;
  }

  private toImageItem(relativePath: string, item: DriveItem): ImageItem {
    const name = basenameRelative(relativePath);
    const download = this.rememberDownload(relativePath, item);
    const updated = item.lastModifiedDateTime ?? new Date().toISOString();
    return {
      id: item.id || stablePathId(relativePath),
      name,
      storagePath: relativePath,
      url: download,
      githubUrl: download,
      ...(download
        ? { publicUrl: download, linkKind: 'remote-raw' as const }
        : {}),
      size: item.size ?? 0,
      width: 0,
      height: 0,
      type: item.file?.mimeType || mimeFromName(name),
      tags: [],
      createdAt: item.createdDateTime ?? updated,
      updatedAt: updated,
    };
  }

  private async listChildren(drivePath: string): Promise<DriveItem[]> {
    const items: DriveItem[] = [];
    let url: string | null = driveItemUrl(drivePath, 'children');
    for (let page = 0; page < 50 && url; page += 1) {
      const response = await this.graph(url);
      if (!response.ok) {
        throw new Error(
          await this.readError(response, `无法列出 OneDrive 目录 ${drivePath}`),
        );
      }
      const data = (await response.json()) as DriveCollection;
      items.push(...(data.value ?? []));
      url = data['@odata.nextLink'] ?? null;
    }
    return items;
  }

  private async collectImages(
    drivePath: string,
    relativeDir: string,
    recursive: boolean,
    into: ImageItem[],
  ): Promise<void> {
    const children = await this.listChildren(drivePath);
    for (const child of children) {
      const name = child.name ?? '';
      if (!name || name === '.metadata' || name === '.pixuli') continue;
      const relativePath = relativeDir ? `${relativeDir}/${name}` : name;
      if (child.folder) {
        if (recursive) {
          await this.collectImages(
            joinConfigRoot(drivePath, name),
            relativePath,
            true,
            into,
          );
        }
        continue;
      }
      if (!child.file || !isImageName(name)) continue;
      into.push(this.toImageItem(relativePath, child));
    }
  }

  private async readManifest(dir: string): Promise<MetadataManifest> {
    const response = await this.graph(
      driveItemUrl(this.fullPath(getDirManifestRelativePath(dir)), 'content'),
    );
    if (response.status === 404) return createEmptyManifest();
    if (!response.ok) {
      throw new Error(
        await this.readError(response, '无法读取 OneDrive 元数据'),
      );
    }
    const text = await response.text();
    try {
      return parseMetadataManifest(JSON.parse(text)) ?? createEmptyManifest();
    } catch {
      return createEmptyManifest();
    }
  }

  private async writeManifest(
    dir: string,
    manifest: MetadataManifest,
  ): Promise<void> {
    const bytes = new TextEncoder().encode(JSON.stringify(manifest));
    await this.putBytes(getDirManifestRelativePath(dir), bytes);
  }

  private applyManifest(images: ImageItem[], manifest: MetadataManifest): void {
    for (const image of images) {
      const fileName = basenameRelative(image.storagePath ?? image.name);
      const entry = getManifestEntry(manifest, fileName);
      if (!entry) continue;
      if (entry.id) image.id = entry.id;
      if (entry.name) image.name = entry.name;
      image.description = entry.description ?? '';
      image.tags = entry.tags ?? [];
      if (entry.width) image.width = entry.width;
      if (entry.height) image.height = entry.height;
      if (entry.updatedAt) image.updatedAt = entry.updatedAt;
      if (entry.createdAt) image.createdAt = entry.createdAt;
      if (entry.type) image.type = entry.type;
    }
  }

  async listImages(options?: ImageListOptions): Promise<ImageItem[]> {
    const config = this.assertConfigured();
    const relativeDir = (options?.path ?? '').replace(/^\/+|\/+$/g, '');
    const drivePath = joinConfigRoot(config.path, relativeDir);
    const images: ImageItem[] = [];
    await this.collectImages(
      drivePath,
      relativeDir,
      options?.recursive !== false,
      images,
    );
    const dirs = new Set(
      images.map(image => dirnameRelative(image.storagePath ?? image.name)),
    );
    for (const dir of dirs) {
      const inDir = images.filter(
        image => dirnameRelative(image.storagePath ?? image.name) === dir,
      );
      this.applyManifest(inDir, await this.readManifest(dir));
    }
    return images;
  }

  private async putBytes(
    relativePath: string,
    bytes: Uint8Array,
  ): Promise<DriveItem> {
    const target = driveItemUrl(this.fullPath(relativePath), 'content');
    if (bytes.byteLength <= ONEDRIVE_SIMPLE_UPLOAD_LIMIT) {
      const response = await this.graph(target, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: toArrayBuffer(bytes),
      });
      if (!response.ok) {
        throw new Error(
          await this.readError(response, `无法上传 ${relativePath}`),
        );
      }
      return (await response.json()) as DriveItem;
    }

    const sessionResponse = await this.graph(
      driveItemUrl(this.fullPath(relativePath), 'createUploadSession'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item: {
            '@microsoft.graph.conflictBehavior': 'replace',
            name: basenameRelative(relativePath),
          },
        }),
      },
    );
    if (!sessionResponse.ok) {
      throw new Error(
        await this.readError(
          sessionResponse,
          `无法创建上传会话 ${relativePath}`,
        ),
      );
    }
    const session = (await sessionResponse.json()) as { uploadUrl?: string };
    if (!session.uploadUrl) {
      throw new Error(`无法创建上传会话 ${relativePath}`);
    }

    let start = 0;
    let last: DriveItem = {};
    while (start < bytes.byteLength) {
      const end = Math.min(start + UPLOAD_CHUNK, bytes.byteLength);
      const chunk = bytes.subarray(start, end);
      const response = await this.fetchFn(session.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Length': String(chunk.byteLength),
          'Content-Range': `bytes ${start}-${end - 1}/${bytes.byteLength}`,
        },
        body: toArrayBuffer(chunk),
      });
      if (response.status === 202) {
        start = end;
        continue;
      }
      if (!response.ok) {
        throw new Error(
          await this.readError(response, `分片上传失败 ${relativePath}`),
        );
      }
      last = (await response.json()) as DriveItem;
      start = end;
    }
    return last;
  }

  private entryFromImage(
    image: Partial<ImageItem> & { name: string },
  ): MetadataManifestFileEntry {
    return manifestEntryFromImageFields({
      id: image.id,
      name: image.name,
      description: image.description,
      tags: image.tags,
      size: image.size,
      width: image.width,
      height: image.height,
      type: image.type,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
    });
  }

  async uploadImage(uploadData: ImageUploadData): Promise<ImageItem> {
    this.assertConfigured();
    const file = uploadData.file;
    const storagePath =
      uploadData.storagePath ??
      (uploadData.targetFolder
        ? `${uploadData.targetFolder.replace(/\/+$/, '')}/${
            uploadData.name ||
            (typeof file === 'string'
              ? file.split('/').pop() || 'image.jpg'
              : file.name)
          }`
        : typeof file === 'string'
          ? uploadData.name || file.split('/').pop() || 'image.jpg'
          : uploadData.name || file.name);
    const displayName = uploadData.name ?? basenameRelative(storagePath);
    const bytes = await readUploadBytes(file, this.platformAdapter);
    const [dimensions, fileSize, mimeType] = await Promise.all([
      this.platformAdapter.getImageDimensions(file).catch(() => ({
        width: 0,
        height: 0,
      })),
      this.platformAdapter.getFileSize(file).catch(() => bytes.byteLength),
      this.platformAdapter
        .getMimeType(file, displayName)
        .catch(() => mimeFromName(displayName)),
    ]);
    const now = new Date().toISOString();
    const uploaded = await this.putBytes(storagePath, bytes);
    const image = this.toImageItem(storagePath, {
      ...uploaded,
      name: displayName,
      size: fileSize,
      file: { mimeType },
      lastModifiedDateTime: uploaded.lastModifiedDateTime ?? now,
      createdDateTime: uploaded.createdDateTime ?? now,
    });
    image.name = displayName;
    image.description = uploadData.description ?? '';
    image.tags = uploadData.tags ?? [];
    image.width = dimensions.width;
    image.height = dimensions.height;
    image.size = fileSize;
    image.type = mimeType;
    if (uploadData.captureMetadata) {
      image.captureMetadata = uploadData.captureMetadata;
    }

    const dir = dirnameRelative(storagePath);
    const manifest = upsertManifestEntry(
      await this.readManifest(dir),
      basenameRelative(storagePath),
      this.entryFromImage(image),
    );
    await this.writeManifest(dir, manifest);
    return image;
  }

  async deleteImage(path: string): Promise<void> {
    this.assertConfigured();
    const response = await this.graph(driveItemUrl(this.fullPath(path)), {
      method: 'DELETE',
    });
    if (!response.ok && response.status !== 404) {
      throw new Error(await this.readError(response, `无法删除 ${path}`));
    }
    const dir = dirnameRelative(path);
    const manifest = removeManifestEntry(
      await this.readManifest(dir),
      basenameRelative(path),
    );
    await this.writeManifest(dir, manifest);
    this.downloadUrls.delete(path);
  }

  async updateImageMetadata(
    path: string,
    metadata: Partial<Pick<ImageItem, 'name' | 'description' | 'tags'>>,
  ): Promise<ImageItem> {
    this.assertConfigured();
    const dir = dirnameRelative(path);
    const fileName = basenameRelative(path);
    const existing = getManifestEntry(await this.readManifest(dir), fileName);
    const now = new Date().toISOString();
    const image: ImageItem = {
      id: existing?.id || stablePathId(path),
      name: metadata.name || existing?.name || fileName,
      storagePath: path,
      url: this.getRawUrl(path),
      githubUrl: this.getRawUrl(path),
      size: existing?.size ?? 0,
      width: existing?.width ?? 0,
      height: existing?.height ?? 0,
      type: existing?.type || mimeFromName(fileName),
      tags: metadata.tags ?? existing?.tags ?? [],
      description: metadata.description ?? existing?.description ?? '',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const manifest = upsertManifestEntry(
      await this.readManifest(dir),
      fileName,
      this.entryFromImage(image),
    );
    await this.writeManifest(dir, manifest);
    return image;
  }

  private async ensureDownloadUrl(item: DriveItem): Promise<string> {
    const direct = item['@microsoft.graph.downloadUrl'];
    if (direct) return direct;
    if (!item.id) return '';
    const response = await this.graph(
      `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(item.id)}?select=id,@microsoft.graph.downloadUrl`,
    );
    if (!response.ok) return '';
    const data = (await response.json()) as DriveItem;
    return data['@microsoft.graph.downloadUrl'] ?? '';
  }

  async syncPull(options?: SyncPullOptions): Promise<SyncPullResult> {
    const config = this.assertConfigured();
    const since = options?.since;
    let url: string | null =
      since && since.startsWith('https://')
        ? since
        : driveItemUrl(config.path, 'delta');
    const raw: DriveItem[] = [];
    let deltaLink: string | undefined;
    for (let page = 0; page < 50 && url; page += 1) {
      const response = await this.graph(url);
      if (response.status === 404) {
        return { items: [], nextCursor: undefined };
      }
      if (!response.ok) {
        throw new Error(
          await this.readError(response, 'OneDrive 增量同步失败'),
        );
      }
      const data = (await response.json()) as DriveCollection;
      raw.push(...(data.value ?? []));
      deltaLink = data['@odata.deltaLink'] ?? deltaLink;
      url = data['@odata.nextLink'] ?? null;
    }

    const items: SyncPullResult['items'] = [];
    for (const item of raw) {
      const relativePath = workspacePathFromDriveItem(item, config.path);
      if (
        !relativePath ||
        isMetadataPath(relativePath) ||
        isSyncExcludedPath(relativePath)
      ) {
        continue;
      }
      if (item.deleted) {
        if (!isImageName(relativePath)) continue;
        items.push({ remotePath: relativePath, action: 'delete' });
        continue;
      }
      if (item.folder || !item.file || !isImageName(relativePath)) continue;
      const download = await this.ensureDownloadUrl(item);
      if (download) this.downloadUrls.set(relativePath, download);
      const updated = item.lastModifiedDateTime ?? new Date().toISOString();
      items.push({
        remotePath: relativePath,
        action: 'add',
        contentHash: item.eTag,
        metadata: {
          id: item.id,
          name: basenameRelative(relativePath),
          url: download,
          size: item.size ?? 0,
          type: item.file.mimeType || mimeFromName(relativePath),
          updatedAt: updated,
          createdAt: item.createdDateTime ?? updated,
        },
      });
    }

    const dirs = new Set(items.map(item => dirnameRelative(item.remotePath)));
    for (const dir of dirs) {
      const manifest = await this.readManifest(dir);
      for (const item of items) {
        if (item.action === 'delete') continue;
        if (dirnameRelative(item.remotePath) !== dir) continue;
        const entry = getManifestEntry(
          manifest,
          basenameRelative(item.remotePath),
        );
        if (!entry || !item.metadata) continue;
        item.metadata = {
          ...item.metadata,
          id: entry.id || item.metadata.id,
          name: entry.name || item.metadata.name,
          description: entry.description,
          tags: entry.tags,
          width: entry.width,
          height: entry.height,
          updatedAt: entry.updatedAt || item.metadata.updatedAt,
          createdAt: entry.createdAt || item.metadata.createdAt,
        };
      }
    }

    this.cursor = deltaLink ?? null;
    return { items, nextCursor: deltaLink };
  }

  async syncPush(items: SyncPushItem[]): Promise<void> {
    this.assertConfigured();
    const groups = new Map<string, SyncPushItem[]>();
    for (const item of items) {
      const dir = dirnameRelative(item.remotePath);
      const group = groups.get(dir) ?? [];
      group.push(item);
      groups.set(dir, group);
    }

    for (const [dir, group] of groups) {
      let manifest = await this.readManifest(dir);
      for (const item of group) {
        const fileName = basenameRelative(item.remotePath);
        if (item.action === 'delete') {
          const response = await this.graph(
            driveItemUrl(this.fullPath(item.remotePath)),
            { method: 'DELETE' },
          );
          if (!response.ok && response.status !== 404) {
            throw new Error(
              await this.readError(response, `无法删除 ${item.remotePath}`),
            );
          }
          manifest = removeManifestEntry(manifest, fileName);
          continue;
        }
        if (item.action === 'upload') {
          if (!item.file) {
            throw new Error(`缺少上传内容 ${item.remotePath}`);
          }
          await this.putBytes(item.remotePath, item.file);
        }
        const meta = item.metadata;
        const now = new Date().toISOString();
        manifest = upsertManifestEntry(
          manifest,
          fileName,
          this.entryFromImage({
            id: meta?.id,
            name: meta?.name || fileName,
            description: meta?.description,
            tags: meta?.tags,
            size: meta?.size ?? item.file?.byteLength,
            width: meta?.width,
            height: meta?.height,
            type: meta?.type,
            createdAt: meta?.createdAt ?? now,
            updatedAt: meta?.updatedAt ?? now,
          }),
        );
      }
      await this.writeManifest(dir, manifest);
    }
  }
}
