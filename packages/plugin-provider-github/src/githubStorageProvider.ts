import type { ImageItem, ImageUploadData } from '@pixuli/core/types';
import {
  basenameRelative,
  createEmptyManifest,
  dirnameRelative,
  getDirManifestRelativePath,
  getManifestEntry,
  manifestEntryFromImageFields,
  manifestEntryToRecord,
  parseManifestEntryRecord,
  parseMetadataManifest,
  removeManifestEntry,
  upsertManifestEntry,
  type MetadataManifest,
} from '@pixuli/core/utils';
import { buildProviderSidecarPayload } from '@pixuli/core/utils';
import type { GitHubConfig } from '@pixuli/core/types';
import { joinConfigRoot, SYNC_EXCLUDED_DIR } from '@pixuli/core/vault';
import type {
  ImageListOptions,
  ImageMetadataLoadOptions,
  ProviderContext,
  StorageProviderConfig,
  StorageProviderWithMetadata,
  SyncPullOptions,
  SyncPullResult,
  SyncPushItem,
} from '@pixuli/core/plugins';
import { githubManifest } from './manifest';

function narrowGitHubConfig(
  config: StorageProviderConfig | GitHubConfig,
): GitHubConfig {
  const { owner, repo, branch, token, path } = config;

  if (
    typeof owner !== 'string' ||
    typeof repo !== 'string' ||
    typeof branch !== 'string' ||
    typeof token !== 'string' ||
    typeof path !== 'string'
  ) {
    throw new Error('Invalid GitHub storage provider config');
  }

  return { owner, repo, branch, token, path };
}

export class GitHubStorageProvider implements StorageProviderWithMetadata {
  readonly manifest = githubManifest;

  private config!: GitHubConfig;
  private readonly baseUrl = 'https://api.github.com';
  private readonly platformAdapter: ProviderContext['platformAdapter'];
  private readonly fetchFn: typeof fetch;
  private readonly logger: Pick<Console, 'log' | 'warn' | 'error'>;
  private syncCursor: string | null = null;

  constructor(ctx: ProviderContext) {
    this.platformAdapter = ctx.platformAdapter;
    this.fetchFn =
      ctx.fetch ??
      ((input: RequestInfo | URL, init?: RequestInit) =>
        globalThis.fetch(input, init));
    this.logger = ctx.logger ?? console;
  }

  configure(config: StorageProviderConfig): void {
    this.config = narrowGitHubConfig(config);
  }

  private assertConfigured(): void {
    if (!this.config) {
      throw new Error('GitHub storage provider is not configured');
    }
  }

  /** 工作区相对路径 → 仓库内完整路径（configRoot + relative） */
  private joinRemotePath(relativePath: string): string {
    return joinConfigRoot(this.config.path, relativePath);
  }

  getRawUrl(path: string): string {
    this.assertConfigured();
    return `https://raw.githubusercontent.com/${this.config.owner}/${this.config.repo}/refs/heads/${this.config.branch}/${this.joinRemotePath(path)}`;
  }

  private async makeGitHubRequest(endpoint: string, options: RequestInit = {}) {
    this.assertConfigured();
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Authorization: `token ${this.config.token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Pixuli',
      ...options.headers,
    };

    const response = await this.fetchFn(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `GitHub API error: ${response.status}`,
      );
    }

    return response.json();
  }

  /**
   * 获取图片尺寸信息
   * @param file 图片文件（web/desktop）或 URI（mobile）
   * @returns Promise<{ width: number; height: number }> 图片尺寸信息
   */
  async getImageDimensions(
    file: File | string,
  ): Promise<{ width: number; height: number }> {
    try {
      return await this.platformAdapter.getImageDimensions(file);
    } catch (error) {
      this.logger.warn(
        'Failed to get image dimensions, using default values:',
        error,
      );
      // 如果获取尺寸失败，使用默认值 0，后续可以通过 URL 获取
      return { width: 0, height: 0 };
    }
  }

  /**
   * 步骤1：上传图片文件到 GitHub
   * @param file 图片文件（web/desktop）或 URI（mobile）
   * @param fileName 文件名
   * @param description 图片描述
   * @returns Promise<{ sha: string; download_url: string; html_url: string }> GitHub API 响应
   */
  private async getContentFileSha(
    filePath: string,
  ): Promise<string | undefined> {
    try {
      const existingFile = await this.makeGitHubRequest(
        `/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}?ref=${this.config.branch}`,
      );
      if (Array.isArray(existingFile)) {
        return undefined;
      }
      return existingFile.sha;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isNotFound =
        errorMessage.includes('404') ||
        errorMessage.includes('Not Found') ||
        errorMessage.includes('does not exist');
      if (isNotFound) {
        return undefined;
      }
      throw error;
    }
  }

  private async uploadImageFile(
    file: File | string,
    fileName: string,
    description?: string,
  ): Promise<{ sha: string; download_url: string; html_url: string }> {
    // 将文件转换为 base64
    const base64Content = await this.platformAdapter.fileToBase64(file);

    // 构建文件路径
    const filePath = this.joinRemotePath(fileName);
    const existingSha = await this.getContentFileSha(filePath);

    const requestBody: Record<string, string> = {
      message: existingSha
        ? `Update image: ${fileName}${description ? ` - ${description}` : ''}`
        : `Upload image: ${fileName}${description ? ` - ${description}` : ''}`,
      content: base64Content,
      branch: this.config.branch,
    };
    if (existingSha) {
      requestBody.sha = existingSha;
    }

    // 调用 GitHub API 上传文件
    const response = await this.makeGitHubRequest(
      `/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}`,
      {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      },
    );

    return {
      sha: response.content.sha,
      download_url: response.content.download_url || '',
      html_url: response.content.html_url || '',
    };
  }

  /**
   * 步骤2：上传图片元数据到 GitHub
   * @param fileName 文件名
   * @param metadata 元数据对象
   * @returns Promise<void>
   */
  private async uploadImageMetadata(
    fileName: string,
    metadata: ImageItem,
  ): Promise<void> {
    try {
      await this.persistImageMetadata(fileName, metadata);
    } catch (error) {
      this.logger.error('Failed to upload metadata:', error);
      // 元数据上传失败不应该阻止整个上传流程，但记录错误
      throw new Error(`上传元数据失败: ${error}`);
    }
  }

  /**
   * 上传图片到 GitHub（完整流程）
   *
   * 流程说明：
   * 1. 获取图片尺寸信息（作为元数据的一部分）
   * 2. 步骤1：上传图片文件到 GitHub
   * 3. 步骤2：上传图片元数据到 GitHub（包含尺寸信息）
   *
   * @param uploadData 上传数据
   * @returns Promise<ImageItem> 上传后的图片信息
   */
  async uploadImage(uploadData: ImageUploadData): Promise<ImageItem> {
    this.assertConfigured();
    try {
      const file = uploadData.file;
      const name = uploadData.name;
      const description = uploadData.description;
      const tags = uploadData.tags;

      const storagePath =
        uploadData.storagePath ??
        (typeof file === 'string'
          ? name || file.split('/').pop() || 'image.jpg'
          : name || file.name);
      const displayName = name ?? storagePath.split('/').pop() ?? storagePath;

      // ========== 准备阶段：获取图片尺寸信息 ==========
      const imageDimensions = await this.getImageDimensions(file);
      const fileSize = await this.platformAdapter.getFileSize(file);
      const mimeType = await this.platformAdapter.getMimeType(
        file,
        displayName,
      );

      // ========== 步骤1：上传图片文件 ==========
      const uploadResponse = await this.uploadImageFile(
        file,
        storagePath,
        description,
      );

      const imageItem: ImageItem = {
        id:
          uploadResponse.sha ||
          `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: displayName,
        storagePath,
        url: uploadResponse.download_url,
        githubUrl: uploadResponse.html_url,
        size: fileSize,
        width: imageDimensions.width,
        height: imageDimensions.height,
        type: mimeType,
        tags: tags || [],
        description: description || '',
        createdAt:
          uploadData.captureMetadata?.takenAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        captureMetadata: uploadData.captureMetadata,
      };

      // ========== 步骤2：上传图片元数据 ==========
      try {
        await this.uploadImageMetadata(storagePath, imageItem);
      } catch (error) {
        this.logger.warn(
          'Image file uploaded successfully, but metadata upload failed:',
          error,
        );
        this.logger.warn(
          'You can update metadata later or it will be fetched from the image URL',
        );
      }

      return imageItem;
    } catch (error) {
      this.logger.error('Upload image failed:', error);
      throw new Error(`上传图片失败: ${error}`);
    }
  }

  // 删除图片
  async deleteImage(path: string): Promise<void> {
    this.assertConfigured();
    try {
      const filePath = this.joinRemotePath(path);

      // 首先获取文件的SHA
      let fileInfo: { sha: string };
      try {
        fileInfo = await this.makeGitHubRequest(
          `/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}?ref=${this.config.branch}`,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const isNotFound =
          errorMessage.includes('404') ||
          errorMessage.includes('Not Found') ||
          errorMessage.includes('not found');
        if (isNotFound) {
          // 远端已无此文件：幂等成功，避免拖垮整批 syncPush
          this.logger.warn(`Remote image already absent: ${path}`);
          return;
        }
        throw error;
      }

      // 删除文件
      await this.makeGitHubRequest(
        `/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}`,
        {
          method: 'DELETE',
          body: JSON.stringify({
            message: `Delete image: ${path}`,
            sha: fileInfo.sha,
            branch: this.config.branch,
          }),
        },
      );

      // 删除对应的元数据文件
      try {
        await this.deleteImageMetadata(path);
      } catch (error) {
        this.logger.warn('Failed to delete metadata file:', error);
        // 不抛出错误，因为图片已经删除成功
      }
    } catch (error) {
      this.logger.error('Delete image failed:', error);
      throw new Error(`删除图片失败: ${error}`);
    }
  }

  private encodeJsonBase64(value: unknown): string {
    const jsonString = JSON.stringify(value, null, 2);
    return btoa(unescape(encodeURIComponent(jsonString)));
  }

  private decodeJsonBase64(base64Content: string): unknown {
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const content = new TextDecoder('utf-8').decode(bytes);
    return JSON.parse(content);
  }

  private async readRepoJsonFile(
    relativePath: string,
  ): Promise<{ data: unknown; sha: string } | null> {
    const filePath = this.joinRemotePath(relativePath);
    try {
      const existingFile = await this.makeGitHubRequest(
        `/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}?ref=${this.config.branch}`,
      );
      if (
        Array.isArray(existingFile) ||
        !existingFile.content ||
        !existingFile.sha
      ) {
        return null;
      }
      return {
        data: this.decodeJsonBase64(
          String(existingFile.content).replace(/\n/g, ''),
        ),
        sha: existingFile.sha,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes('404') ||
        errorMessage.includes('Not Found') ||
        errorMessage.includes('does not exist')
      ) {
        return null;
      }
      throw error;
    }
  }

  private async writeRepoJsonFile(
    relativePath: string,
    data: unknown,
    message: string,
    existingSha?: string,
  ): Promise<void> {
    const filePath = this.joinRemotePath(relativePath);
    const requestBody: Record<string, string> = {
      message,
      content: this.encodeJsonBase64(data),
      branch: this.config.branch,
    };
    if (existingSha) {
      requestBody.sha = existingSha;
    }
    await this.makeGitHubRequest(
      `/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}`,
      {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      },
    );
  }

  private async loadDirManifest(dirPath: string): Promise<MetadataManifest> {
    const manifestPath = getDirManifestRelativePath(dirPath);
    const file = await this.readRepoJsonFile(manifestPath);
    if (!file) {
      return createEmptyManifest();
    }
    return parseMetadataManifest(file.data) ?? createEmptyManifest();
  }

  private async saveDirManifest(
    dirPath: string,
    manifest: MetadataManifest,
    summary: string,
  ): Promise<void> {
    const manifestPath = getDirManifestRelativePath(dirPath);
    const existing = await this.readRepoJsonFile(manifestPath);
    await this.writeRepoJsonFile(
      manifestPath,
      manifest,
      existing
        ? `Update metadata manifest: ${summary}`
        : `Create metadata manifest: ${summary}`,
      existing?.sha,
    );
  }

  private async deleteImageMetadata(storagePath: string): Promise<void> {
    const dirPath = dirnameRelative(storagePath);
    const fileName = basenameRelative(storagePath);
    const manifest = await this.loadDirManifest(dirPath);
    if (!getManifestEntry(manifest, fileName)) {
      return;
    }
    const next = removeManifestEntry(manifest, fileName);
    await this.saveDirManifest(dirPath, next, storagePath);
  }

  private async getImageMetadata(
    storagePath: string,
  ): Promise<Record<string, unknown> | null> {
    const dirPath = dirnameRelative(storagePath);
    const fileName = basenameRelative(storagePath);
    const manifest = await this.loadDirManifest(dirPath);
    const entry = getManifestEntry(manifest, fileName);
    if (!entry) {
      return null;
    }
    return manifestEntryToRecord(entry);
  }

  private async persistImageMetadata(
    storagePath: string,
    metadata: Partial<ImageItem> & Record<string, unknown>,
  ): Promise<void> {
    const dirPath = dirnameRelative(storagePath);
    const fileName = basenameRelative(storagePath);
    const manifest = await this.loadDirManifest(dirPath);
    const existing = getManifestEntry(manifest, fileName);
    const merged = buildProviderSidecarPayload({
      id: existing?.id,
      name: metadata.name ?? existing?.name ?? fileName,
      description: metadata.description ?? existing?.description ?? '',
      tags: metadata.tags ?? existing?.tags ?? [],
      size: metadata.size ?? existing?.size ?? 0,
      width: metadata.width ?? existing?.width ?? 0,
      height: metadata.height ?? existing?.height ?? 0,
      updatedAt: new Date().toISOString(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      captureMetadata: metadata.captureMetadata ?? existing?.capture,
    } as ImageItem);
    const entry =
      parseManifestEntryRecord(merged) ??
      manifestEntryFromImageFields({ name: fileName });
    const next = upsertManifestEntry(manifest, fileName, entry);
    await this.saveDirManifest(dirPath, next, storagePath);
  }

  private async collectImageFiles(
    dirRelative: string,
  ): Promise<Array<{ remotePath: string; item: any }>> {
    const dirPath = this.joinRemotePath(dirRelative);
    const response = await this.makeGitHubRequest(
      `/repos/${this.config.owner}/${this.config.repo}/contents/${dirPath}?ref=${this.config.branch}`,
    );
    if (!Array.isArray(response)) {
      return [];
    }

    const results: Array<{ remotePath: string; item: any }> = [];
    for (const entry of response) {
      if (entry.name === '.metadata' || entry.name === SYNC_EXCLUDED_DIR) {
        continue;
      }
      if (entry.type === 'dir') {
        const subDir = dirRelative
          ? `${dirRelative}/${entry.name}`
          : entry.name;
        results.push(...(await this.collectImageFiles(subDir)));
        continue;
      }
      if (entry.type === 'file' && this.isImageFile(entry.name)) {
        const remotePath = dirRelative
          ? `${dirRelative}/${entry.name}`
          : entry.name;
        results.push({ remotePath, item: entry });
      }
    }
    return results;
  }

  // 获取图片列表
  async listImages(options?: ImageListOptions): Promise<ImageItem[]> {
    this.assertConfigured();
    try {
      const recursive = options?.recursive ?? false;
      let imageEntries: Array<{ remotePath: string; item: any }>;

      if (recursive) {
        imageEntries = await this.collectImageFiles('');
      } else {
        const response = await this.makeGitHubRequest(
          `/repos/${this.config.owner}/${this.config.repo}/contents/${this.joinRemotePath('')}?ref=${this.config.branch}`,
        );
        imageEntries = (Array.isArray(response) ? response : [])
          .filter(
            (item: any) =>
              item.type === 'file' &&
              this.isImageFile(item.name) &&
              item.name !== SYNC_EXCLUDED_DIR,
          )
          .map((item: any) => ({ remotePath: item.name, item }));
      }

      const manifestCache = new Map<string, MetadataManifest>();
      const loadManifestCached = async (dirPath: string) => {
        if (!manifestCache.has(dirPath)) {
          manifestCache.set(dirPath, await this.loadDirManifest(dirPath));
        }
        return manifestCache.get(dirPath)!;
      };

      const images = await Promise.all(
        imageEntries.map(async ({ remotePath, item }) => {
          let metadata: Record<string, unknown> | null = null;
          try {
            const dirPath = dirnameRelative(remotePath);
            const fileName = basenameRelative(remotePath);
            const manifest = await loadManifestCached(dirPath);
            const entry = getManifestEntry(manifest, fileName);
            metadata = entry ? manifestEntryToRecord(entry) : null;
          } catch (error) {
            this.logger.log(
              `Failed to fetch metadata for ${remotePath}:`,
              error,
            );
          }

          const fileName = basenameRelative(remotePath);
          return {
            id: (metadata?.id as string | undefined) || item.sha,
            name: (metadata?.name as string | undefined) || fileName,
            storagePath: remotePath,
            url: item.download_url || '',
            githubUrl: item.html_url || '',
            size: (metadata?.size as number | undefined) || item.size || 0,
            width: (metadata?.width as number | undefined) || 0,
            height: (metadata?.height as number | undefined) || 0,
            type: this.getMimeType(fileName),
            tags: (metadata?.tags as string[] | undefined) || [],
            description: (metadata?.description as string | undefined) || '',
            createdAt:
              (metadata?.createdAt as string | undefined) ||
              new Date().toISOString(),
            updatedAt:
              (metadata?.updatedAt as string | undefined) ||
              new Date().toISOString(),
          };
        }),
      );

      // 检查重复ID
      const idCounts = images.reduce(
        (acc: Record<string, number>, img: ImageItem) => {
          acc[img.id] = (acc[img.id] || 0) + 1;
          return acc;
        },
        {},
      );

      const duplicateIds = Object.entries(idCounts).filter(
        ([_, count]) => (count as number) > 1,
      );
      if (duplicateIds.length > 0) {
        this.logger.warn('发现重复的图片ID:', duplicateIds);
        // 为重复的ID添加后缀以确保唯一性
        const processedImages = images.map((img: ImageItem, index: number) => {
          if (idCounts[img.id] > 1) {
            return {
              ...img,
              id: `${img.id}-${index}`,
            };
          }
          return img;
        });
        return processedImages;
      }

      return images;
    } catch (error) {
      this.logger.error('Get image list failed:', error);
      throw new Error(`获取图片列表失败: ${error}`);
    }
  }

  // 更新图片信息（如标签、描述等）
  async updateImageMetadata(
    path: string,
    metadata: Partial<Pick<ImageItem, 'name' | 'description' | 'tags'>>,
  ): Promise<ImageItem> {
    this.assertConfigured();
    try {
      await this.persistImageMetadata(path, metadata);
      return {
        id: path,
        name: metadata.name ?? path,
        url: this.getRawUrl(path),
        githubUrl: `https://github.com/${this.config.owner}/${this.config.repo}/blob/${this.config.branch}/${this.joinRemotePath(path)}`,
        size: 0,
        width: 0,
        height: 0,
        type: this.getMimeType(path),
        tags: metadata.tags ?? [],
        description: metadata.description ?? '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Update image info failed:', error);
      throw new Error(`更新图片信息失败: ${error}`);
    }
  }

  /** @deprecated 兼容 GitHubStorageService 方法名，新代码请用 StorageProvider API */
  async updateImageInfo(
    _imageId: string,
    fileName: string,
    metadata: Partial<Pick<ImageItem, 'name' | 'description' | 'tags'>>,
  ): Promise<void> {
    await this.updateImageMetadata(fileName, metadata);
  }

  /**
   * 异步加载图片元数据并更新图片列表
   * @param images 图片列表
   * @param options 加载选项
   * @param options.forceRefresh 强制刷新，忽略缓存
   * @param options.backgroundUpdate 后台更新，使用缓存但后台检查更新
   */
  async loadImageMetadata(
    images: ImageItem[],
    _options?: ImageMetadataLoadOptions,
  ): Promise<ImageItem[]> {
    try {
      // const { forceRefresh = false } = options || {};

      // 批量获取元数据
      const metadataPromises = images.map(async img => {
        try {
          const metadataPath = img.storagePath ?? img.name;
          const metadata = await this.getImageMetadata(metadataPath);
          if (metadata) {
            return {
              ...img,
              size: metadata.size || img.size || 0,
              width: metadata.width || img.width || 0,
              height: metadata.height || img.height || 0,
              tags: metadata.tags || img.tags || [],
              description: metadata.description || img.description || '',
              updatedAt: metadata.updatedAt || img.updatedAt,
              createdAt: metadata.createdAt || img.createdAt,
            };
          }
          return img;
        } catch (error) {
          this.logger.log(`Failed to load metadata for ${img.name}:`, error);
          return img;
        }
      });

      return await Promise.all(metadataPromises);
    } catch (error) {
      this.logger.error('Load image metadata failed:', error);
      // 即使加载元数据失败，也返回原始图片列表
      return images;
    }
  }

  async getSyncCursor(): Promise<string | null> {
    return this.syncCursor;
  }

  async syncPull(options?: SyncPullOptions): Promise<SyncPullResult> {
    const images = await this.listImages({ recursive: true });
    const since = options?.since;
    const items = images
      .map(img => {
        const remotePath = img.storagePath ?? img.name;
        return {
          remotePath,
          action: 'update' as const,
          contentHash: img.id,
          metadata: {
            name: img.name,
            tags: img.tags,
            description: img.description,
            width: img.width,
            height: img.height,
            size: img.size,
            type: img.type,
            createdAt: img.createdAt,
            updatedAt: img.updatedAt,
            url: img.url,
          },
        };
      })
      .filter(item => !since || (item.metadata.updatedAt ?? '') > since);

    this.syncCursor = new Date().toISOString();
    return { items, nextCursor: this.syncCursor };
  }

  async syncPush(items: SyncPushItem[]): Promise<void> {
    for (const item of items) {
      if (item.action === 'delete') {
        await this.deleteImage(item.remotePath);
        continue;
      }
      if (item.action === 'metadata') {
        await this.updateImageMetadata(item.remotePath, item.metadata ?? {});
        continue;
      }
      if (!item.file) {
        throw new Error(`Missing file bytes for ${item.remotePath}`);
      }
      const file = new File([Uint8Array.from(item.file)], item.remotePath, {
        type: item.metadata?.type ?? this.getMimeType(item.remotePath),
      });
      await this.uploadImage({
        file,
        name: item.metadata?.name,
        storagePath: item.remotePath,
        tags: item.metadata?.tags,
        description: item.metadata?.description,
      });
    }
  }

  // 辅助方法：判断是否为图片文件
  private isImageFile(fileName: string): boolean {
    const imageExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.bmp',
      '.webp',
      '.svg',
    ];
    const extension = fileName
      .toLowerCase()
      .substring(fileName.lastIndexOf('.'));
    return imageExtensions.includes(extension);
  }

  // 辅助方法：获取 MIME 类型
  private getMimeType(fileName: string): string {
    const extension = fileName
      .toLowerCase()
      .substring(fileName.lastIndexOf('.'));
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };
    return mimeTypes[extension] || 'image/jpeg';
  }
}
