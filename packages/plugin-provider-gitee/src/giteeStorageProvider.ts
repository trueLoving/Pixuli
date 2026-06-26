import type {
  GiteeConfig,
  ImageItem,
  ImageUploadData,
} from '@pixuli/core/types';
import { buildProviderSidecarPayload } from '@pixuli/core/utils';
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
import { giteeManifest } from './manifest';
import { GITEE_PROXY_PATH } from './proxy/constants.js';

function narrowGiteeConfig(
  config: StorageProviderConfig | GiteeConfig,
): GiteeConfig {
  const { owner, repo, branch, token, path } = config;

  if (
    typeof owner !== 'string' ||
    typeof repo !== 'string' ||
    typeof branch !== 'string' ||
    typeof token !== 'string' ||
    typeof path !== 'string'
  ) {
    throw new Error('Invalid Gitee storage provider config');
  }

  return { owner, repo, branch, token, path };
}

export interface GiteeStorageProviderOptions {
  useProxy?: boolean;
  /** 桌面 file:// 下需绝对地址，如 http://127.0.0.1:39281 */
  proxyBaseUrl?: string;
}

export class GiteeStorageProvider implements StorageProviderWithMetadata {
  readonly manifest = giteeManifest;

  private config!: GiteeConfig;
  private readonly baseUrl = 'https://gitee.com/api/v5';
  private readonly platformAdapter: ProviderContext['platformAdapter'];
  private readonly fetchFn: typeof fetch;
  private readonly logger: Pick<Console, 'log' | 'warn' | 'error'>;
  private readonly useProxy: boolean;
  private readonly proxyBaseUrl?: string;
  private syncCursor: string | null = null;

  constructor(ctx: ProviderContext, options: GiteeStorageProviderOptions = {}) {
    this.platformAdapter = ctx.platformAdapter;
    this.fetchFn =
      ctx.fetch ??
      ((input: RequestInfo | URL, init?: RequestInit) =>
        globalThis.fetch(input, init));
    this.logger = ctx.logger ?? console;
    this.useProxy = options.useProxy ?? false;
    this.proxyBaseUrl = options.proxyBaseUrl ?? ctx.giteeProxyBase;
  }

  configure(config: StorageProviderConfig): void {
    this.config = narrowGiteeConfig(config);
  }

  private assertConfigured(): void {
    if (!this.config) {
      throw new Error('Gitee storage provider is not configured');
    }
  }

  getRawUrl(path: string): string {
    this.assertConfigured();
    const filePath = `${this.config.path}/${path}`;
    return this.buildRawUrl(
      this.config.owner,
      this.config.repo,
      this.config.branch,
      filePath,
    );
  }

  /**
   * 将 Gitee API 返回的 download_url 转换为 raw URL 格式
   */
  private buildRawUrl(
    owner: string,
    repo: string,
    branch: string,
    path: string,
  ): string {
    // Gitee raw URL 格式: https://gitee.com/{owner}/{repo}/raw/{branch}/{path}
    // 注意：path 需要正确编码，但不需要对整个路径进行编码
    const encodedPath = path
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');
    const rawPath = `/${owner}/${repo}/raw/${encodeURIComponent(branch)}/${encodedPath}`;

    if (this.useProxy) {
      const prefix = this.proxyBaseUrl
        ? `${this.proxyBaseUrl.replace(/\/$/, '')}${GITEE_PROXY_PATH}`
        : GITEE_PROXY_PATH;
      return `${prefix}${rawPath}`;
    }

    return `https://gitee.com${rawPath}`;
  }

  private async makeGiteeRequest(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<any> {
    this.assertConfigured();
    let url: string;
    if (endpoint.includes('?')) {
      // endpoint 已经包含查询参数，使用 & 连接 access_token
      url = `${this.baseUrl}${endpoint}&access_token=${encodeURIComponent(this.config.token)}`;
    } else {
      // endpoint 没有查询参数，使用 ? 连接 access_token
      url = `${this.baseUrl}${endpoint}?access_token=${encodeURIComponent(this.config.token)}`;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const response = await this.fetchFn(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: any = {};
      try {
        errorData = JSON.parse(errorText);
      } catch {
        // 如果解析失败，使用原始文本
      }
      throw new Error(
        errorData.message ||
          `Gitee API 错误: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    // 处理空响应
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return null;
  }

  /**
   * 获取文件的 SHA 值
   */
  private async getFileSha(
    path: string,
    branch: string,
  ): Promise<string | null> {
    try {
      const endpoint = `/repos/${this.config.owner}/${this.config.repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
      const response = await this.makeGiteeRequest(endpoint, {
        method: 'GET',
      });

      // Gitee API 返回的数据结构：
      // 单个文件时返回对象，包含 sha 字段
      // 目录时返回数组
      if (!response || Array.isArray(response)) {
        return null;
      }

      return response.sha || null;
    } catch (error: any) {
      // 文件不存在时返回 null，不抛出错误
      if (error.message?.includes('404') || error.message?.includes('401')) {
        return null;
      }
      throw error;
    }
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
   * 步骤1：上传图片文件到 Gitee
   * @param file 图片文件（web/desktop）或 URI（mobile）
   * @param fileName 文件名
   * @param description 图片描述
   * @returns Promise<{ sha: string; downloadUrl: string; htmlUrl: string }> Gitee API 响应
   */
  private async uploadImageFile(
    file: File | string,
    fileName: string,
    description?: string,
  ): Promise<{ sha: string; downloadUrl: string; htmlUrl: string }> {
    // 将文件转换为 base64
    const base64Content = await this.platformAdapter.fileToBase64(file);

    // 构建文件路径
    const filePath = `${this.config.path}/${fileName}`;

    // 首先检查文件是否已存在
    const existingSha = await this.getFileSha(filePath, this.config.branch);

    const requestBody: any = {
      message: existingSha
        ? `Update image: ${fileName}${description ? ` - ${description}` : ''}`
        : `Add image: ${fileName}${description ? ` - ${description}` : ''}`,
      content: base64Content,
      branch: this.config.branch,
    };

    if (existingSha) {
      requestBody.sha = existingSha;
    }

    // 调用 Gitee API 上传文件
    const endpoint = `/repos/${this.config.owner}/${this.config.repo}/contents/${encodeURIComponent(filePath)}`;
    const response = await this.makeGiteeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // 使用 raw URL 替代 API 返回的 download_url，避免跨域问题
    const rawUrl = this.buildRawUrl(
      this.config.owner,
      this.config.repo,
      this.config.branch,
      filePath,
    );

    return {
      sha: response.content?.sha || '',
      downloadUrl: rawUrl,
      htmlUrl: response.content?.html_url || '',
    };
  }

  /**
   * 步骤2：上传图片元数据到 Gitee
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
   * 上传图片到 Gitee（完整流程）
   *
   * 流程说明：
   * 1. 获取图片尺寸信息（作为元数据的一部分）
   * 2. 步骤1：上传图片文件到 Gitee
   * 3. 步骤2：上传图片元数据到 Gitee（包含尺寸信息）
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

      // 从 file 或 URI 中提取文件名
      let fileName: string;
      if (typeof file === 'string') {
        fileName = name || file.split('/').pop() || 'image.jpg';
      } else {
        fileName = name || file.name;
      }

      // ========== 准备阶段：获取图片尺寸信息 ==========
      // 在上传前获取图片尺寸，作为元数据的一部分
      const imageDimensions = await this.getImageDimensions(file);
      const fileSize = await this.platformAdapter.getFileSize(file);
      const mimeType = await this.platformAdapter.getMimeType(file, fileName);

      // ========== 步骤1：上传图片文件 ==========
      const uploadResponse = await this.uploadImageFile(
        file,
        fileName,
        description,
      );

      // ========== 构建图片元数据对象 ==========
      // 包含所有元数据信息：尺寸、标签、描述等
      const imageItem: ImageItem = {
        id:
          uploadResponse.sha ||
          `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: fileName,
        url: uploadResponse.downloadUrl,
        githubUrl: uploadResponse.htmlUrl,
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
      // 将包含尺寸信息的元数据上传到 Gitee
      try {
        await this.uploadImageMetadata(fileName, imageItem);
      } catch (error) {
        // 元数据上传失败时，记录警告但不影响图片上传的成功
        // 因为图片文件已经成功上传，元数据可以在后续补充
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
      const filePath = `${this.config.path}/${path}`;

      // 获取文件的当前 SHA
      const sha = await this.getFileSha(filePath, this.config.branch);
      if (!sha) {
        throw new Error('文件不存在');
      }

      // 删除文件
      const endpoint = `/repos/${this.config.owner}/${this.config.repo}/contents/${encodeURIComponent(filePath)}`;
      await this.makeGiteeRequest(endpoint, {
        method: 'DELETE',
        body: JSON.stringify({
          message: `Delete image: ${path}`,
          sha,
          branch: this.config.branch,
        }),
      });

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

  // 删除图片元数据文件
  private async deleteImageMetadata(fileName: string): Promise<void> {
    try {
      const metadataFileName = this.getMetadataFileName(fileName);
      const metadataFilePath = `${this.config.path}/.metadata/${metadataFileName}`;

      // 检查元数据文件是否存在
      const metadataSha = await this.getFileSha(
        metadataFilePath,
        this.config.branch,
      );

      if (!metadataSha) {
        // 元数据文件不存在，无需删除
        return;
      }

      // 删除元数据文件
      const endpoint = `/repos/${this.config.owner}/${this.config.repo}/contents/${encodeURIComponent(metadataFilePath)}`;
      await this.makeGiteeRequest(endpoint, {
        method: 'DELETE',
        body: JSON.stringify({
          message: `Delete metadata for image: ${fileName}`,
          sha: metadataSha,
          branch: this.config.branch,
        }),
      });
    } catch (error) {
      // 删除元数据失败不应该阻止图片删除，只记录警告
      this.logger.warn(`Failed to delete metadata for ${fileName}:`, error);
      throw new Error(`Failed to delete metadata for ${fileName}: ${error}`);
    }
  }

  // 获取图片列表
  async listImages(_options?: ImageListOptions): Promise<ImageItem[]> {
    this.assertConfigured();
    try {
      const endpoint = `/repos/${this.config.owner}/${this.config.repo}/contents/${encodeURIComponent(this.config.path)}?ref=${this.config.branch}`;
      const response = await this.makeGiteeRequest(endpoint, {
        method: 'GET',
      });

      if (!Array.isArray(response)) {
        return [];
      }

      // 筛选出图片文件
      const imageFiles = response.filter(
        (item: any) => this.isImageFile(item.name) && item.type === 'file',
      );

      if (imageFiles.length === 0) {
        return [];
      }

      // 批量获取 metadata 文件
      const metadataMap = new Map<string, any>();

      try {
        const metadataEndpoint = `/repos/${this.config.owner}/${this.config.repo}/contents/${encodeURIComponent(this.config.path + '/.metadata')}?ref=${this.config.branch}`;
        const metadataResponse = await this.makeGiteeRequest(metadataEndpoint, {
          method: 'GET',
        });

        if (Array.isArray(metadataResponse)) {
          const metadataPromises = metadataResponse
            .filter((file: any) => file.name.endsWith('.json'))
            .map(async (file: any) => {
              try {
                const fileEndpoint = `/repos/${this.config.owner}/${this.config.repo}/contents/${encodeURIComponent(file.path)}?ref=${this.config.branch}`;
                const fileResponse = await this.makeGiteeRequest(fileEndpoint, {
                  method: 'GET',
                });

                if (fileResponse.content) {
                  // Gitee API 返回的 content 是 base64 编码的字符串
                  // 使用正确的方式解码 UTF-8 编码的 base64 字符串
                  const base64Content = fileResponse.content;
                  try {
                    // 方法1: 使用 atob 解码，然后处理 UTF-8
                    const binaryString = atob(base64Content);
                    // 将二进制字符串转换为 UTF-8 字符串
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                      bytes[i] = binaryString.charCodeAt(i);
                    }
                    const content = new TextDecoder('utf-8').decode(bytes);
                    const metadata = JSON.parse(content);
                    let imageName = file.name;
                    if (file.name.includes('.metadata.')) {
                      imageName = file.name.replace(
                        /\.metadata\.([^.]+)\.json$/,
                        '.$1',
                      );
                    } else {
                      imageName = file.name.replace('.json', '');
                    }
                    metadataMap.set(imageName, metadata);
                    if (file.name !== imageName) {
                      metadataMap.set(file.name, metadata);
                    }
                  } catch (decodeError) {
                    // 如果解码失败，记录错误但继续处理其他文件
                    this.logger.log(
                      `Failed to decode metadata file ${file.name}:`,
                      decodeError,
                    );
                  }
                }
              } catch (error) {
                // 忽略单个 metadata 文件加载失败
                this.logger.log(
                  `Failed to load metadata file ${file.name}:`,
                  error,
                );
              }
            });

          await Promise.all(metadataPromises);
        }
      } catch (metadataError) {
        // .metadata 目录不存在或无法访问，使用默认值
        this.logger.log(
          'Metadata directory not found or inaccessible:',
          metadataError,
        );
      }

      // 构建最终结果
      const defaultDate = new Date().toISOString();
      const images = imageFiles.map((item: any) => {
        const metadataKey = item.name.replace(/\.metadata\.[^.]+\.json$/, '');
        const parsedMetadata =
          metadataMap.get(metadataKey) || metadataMap.get(item.name);
        const metadata = parsedMetadata
          ? {
              size: parsedMetadata.size || item.size || 0,
              width: parsedMetadata.width || 0,
              height: parsedMetadata.height || 0,
              tags: Array.isArray(parsedMetadata.tags)
                ? parsedMetadata.tags
                : [],
              description: parsedMetadata.description || '',
              updatedAt: parsedMetadata.updatedAt || defaultDate,
            }
          : {
              size: item.size || 0,
              width: 0,
              height: 0,
              tags: [] as string[],
              description: '',
              updatedAt: defaultDate,
            };

        // 使用 raw URL 替代 API 返回的 download_url，避免跨域问题
        const filePath = `${this.config.path}/${item.name}`;
        const rawUrl = this.buildRawUrl(
          this.config.owner,
          this.config.repo,
          this.config.branch,
          filePath,
        );

        return {
          id: parsedMetadata?.id || item.sha,
          name: parsedMetadata?.name || item.name,
          url: rawUrl,
          githubUrl: item.html_url || '',
          size: metadata.size,
          width: metadata.width,
          height: metadata.height,
          type: this.getMimeType(item.name),
          tags: metadata.tags,
          description: metadata.description,
          createdAt: parsedMetadata?.createdAt || defaultDate,
          updatedAt: metadata.updatedAt,
        };
      });

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

  async updateImageMetadata(
    path: string,
    metadata: Partial<Pick<ImageItem, 'name' | 'description' | 'tags'>> & {
      id?: string;
      size?: number;
      width?: number;
      height?: number;
      createdAt?: string;
      updatedAt?: string;
    },
  ): Promise<ImageItem> {
    this.assertConfigured();
    try {
      await this.persistImageMetadata(path, metadata);
      const filePath = `${this.config.path}/${path}`;
      return {
        id: metadata.id ?? path,
        name: metadata.name ?? path,
        url: this.buildRawUrl(
          this.config.owner,
          this.config.repo,
          this.config.branch,
          filePath,
        ),
        githubUrl: `https://gitee.com/${this.config.owner}/${this.config.repo}/blob/${this.config.branch}/${filePath}`,
        size: metadata.size ?? 0,
        width: metadata.width ?? 0,
        height: metadata.height ?? 0,
        type: this.getMimeType(path),
        tags: metadata.tags ?? [],
        description: metadata.description ?? '',
        createdAt: metadata.createdAt ?? new Date().toISOString(),
        updatedAt: metadata.updatedAt ?? new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Update image info failed:', error);
      throw new Error(`更新图片信息失败: ${error}`);
    }
  }

  /** @deprecated 兼容 GiteeStorageService 方法名，新代码请用 StorageProvider API */
  async updateImageInfo(
    _imageId: string,
    fileName: string,
    metadata: Partial<Pick<ImageItem, 'name' | 'description' | 'tags'>> & {
      id?: string;
      size?: number;
      width?: number;
      height?: number;
      createdAt?: string;
      updatedAt?: string;
    },
  ): Promise<void> {
    await this.updateImageMetadata(fileName, metadata);
  }

  private async persistImageMetadata(
    fileName: string,
    metadata: any,
  ): Promise<void> {
    try {
      const metadataFileName = this.getMetadataFileName(fileName);
      const metadataFilePath = `${this.config.path}/.metadata/${metadataFileName}`;

      const metadataContent = buildProviderSidecarPayload(metadata);

      // 将元数据转换为 base64
      const jsonString = JSON.stringify(metadataContent, null, 2);
      const base64Content = btoa(unescape(encodeURIComponent(jsonString)));

      // 获取文件的当前 SHA（如果文件存在）
      const fileSha = await this.getFileSha(
        metadataFilePath,
        this.config.branch,
      );

      // 构建请求参数
      const requestBody: any = {
        message: fileSha
          ? `Update metadata for image: ${fileName}`
          : `Create metadata for image: ${fileName}`,
        content: base64Content,
        branch: this.config.branch,
      };

      // 根据文件是否存在选择使用 POST 或 PUT 方法
      // POST: 创建新文件（如果文件已存在且没有 SHA，会报错）
      // PUT: 更新已存在的文件（必须提供 SHA）
      if (fileSha) {
        // 文件存在，使用 PUT 方法更新，必须提供 SHA
        requestBody.sha = fileSha;
      }

      const endpoint = `/repos/${this.config.owner}/${this.config.repo}/contents/${encodeURIComponent(metadataFilePath)}`;
      const method = fileSha ? 'PUT' : 'POST';

      // 创建或更新元数据文件
      try {
        await this.makeGiteeRequest(endpoint, {
          method,
          body: JSON.stringify(requestBody),
        });
      } catch (error: any) {
        // 如果错误是因为 SHA 不匹配，重新获取最新的 SHA 并重试
        const errorMessage = error?.message || '';
        if (errorMessage.includes('does not match') && fileSha) {
          try {
            // 重新获取最新的 SHA
            const latestSha = await this.getFileSha(
              metadataFilePath,
              this.config.branch,
            );
            if (latestSha) {
              // 使用最新的 SHA 重试
              const retryRequestBody = {
                message: `Update metadata for image: ${fileName}`,
                content: base64Content,
                sha: latestSha,
                branch: this.config.branch,
              };
              await this.makeGiteeRequest(endpoint, {
                method: 'PUT',
                body: JSON.stringify(retryRequestBody),
              });
            } else {
              throw error;
            }
          } catch (retryError) {
            // 重试失败，抛出原始错误
            throw error;
          }
        } else {
          throw error;
        }
      }
    } catch (error) {
      this.logger.error('Update image metadata failed:', error);
      throw new Error(`更新图片元数据失败: ${error}`);
    }
  }

  // 获取元数据文件名
  private getMetadataFileName(fileName: string): string {
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const extension = fileName.substring(fileName.lastIndexOf('.'));
    // 格式：filename.metadata.ext.json (例如：abc23.metadata.png.json)
    return `${nameWithoutExt}.metadata${extension}.json`;
  }

  /**
   * 获取图片元数据
   */
  private async getImageMetadata(fileName: string): Promise<any | null> {
    try {
      const metadataFileName = this.getMetadataFileName(fileName);
      // 使用 Gitee raw URL 直接获取文件内容
      const metadataUrl = this.buildRawUrl(
        this.config.owner,
        this.config.repo,
        this.config.branch,
        `${this.config.path}/.metadata/${metadataFileName}`,
      );

      const response = await this.fetchFn(metadataUrl);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.status}`);
      }

      const metadataContent = await response.json();
      return metadataContent;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      return null;
    }
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
      // 批量获取元数据
      const metadataPromises = images.map(async img => {
        try {
          const metadata = await this.getImageMetadata(img.name);
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
    const images = await this.listImages();
    const since = options?.since;
    const items = images
      .map(img => ({
        remotePath: img.name,
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
      }))
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
