import { ImageItem, GiteeConfig } from 'pixuli-ui/src';
import { getImageInfoFromUri } from '../utils/imageUtils';
import { MetadataCache } from '../utils/metadataCache';

export class GiteeStorageService {
  private config: GiteeConfig;
  private baseUrl = 'https://gitee.com/api/v5';

  constructor(config: GiteeConfig) {
    this.config = config;
  }

  /**
   * 将文件 URI 转换为 base64
   */
  private async uriToBase64(uri: string): Promise<string> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to convert URI to base64:', error);
      throw new Error('文件读取失败');
    }
  }

  /**
   * 获取图片信息
   */
  private async getImageInfo(uri: string) {
    try {
      return await getImageInfoFromUri(uri);
    } catch (error) {
      console.warn('获取图片信息失败，使用默认值:', error);
      return { width: 0, height: 0 };
    }
  }

  /**
   * 检查是否为图片文件
   */
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

  /**
   * 获取 MIME 类型
   */
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
    return mimeTypes[extension] || 'image/unknown';
  }

  /**
   * 构建 Gitee raw URL
   */
  private getRawUrl(
    owner: string,
    repo: string,
    branch: string,
    path: string
  ): string {
    const encodedPath = path
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');
    return `https://gitee.com/${owner}/${repo}/raw/${encodeURIComponent(branch)}/${encodedPath}`;
  }

  /**
   * 发送 Gitee API 请求
   */
  private async makeRequest(
    method: string,
    path: string,
    body?: any
  ): Promise<any> {
    if (!this.config.token) {
      throw new Error('Gitee 认证未设置');
    }

    // 验证 token 不为空字符串
    if (this.config.token.trim() === '') {
      throw new Error('Gitee Token 不能为空');
    }

    // Gitee API v5 使用 access_token 作为查询参数
    // 注意：path 可能已经包含查询参数（如 ref=branch），需要正确处理
    let url: string;
    if (path.includes('?')) {
      // path 已经包含查询参数，使用 & 连接 access_token
      url = `${this.baseUrl}${path}&access_token=${encodeURIComponent(this.config.token)}`;
    } else if (path.includes('&')) {
      // path 包含 & 但没有 ?，说明可能是特殊格式
      url = `${this.baseUrl}${path}&access_token=${encodeURIComponent(this.config.token)}`;
    } else {
      // path 没有查询参数，使用 ? 连接 access_token
      url = `${this.baseUrl}${path}?access_token=${encodeURIComponent(this.config.token)}`;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      // 对于 POST/PUT/DELETE 请求，access_token 已经在 URL 中，不需要在 body 中重复
      // 但如果 body 中有 access_token，需要移除它
      const { access_token, ...bodyWithoutToken } = body;
      options.body = JSON.stringify(bodyWithoutToken);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        // 如果是 401 错误，提供更详细的错误信息
        if (response.status === 401) {
          throw new Error(
            `Gitee API 认证失败 (401): 请检查 Token 是否正确，并确保 Token 具有 projects 和 repo 权限。错误详情: ${errorText}`
          );
        }
        throw new Error(
          `Gitee API 错误: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      // 处理空响应
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return null;
    } catch (error) {
      // 如果是网络错误，提供更友好的错误信息
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('网络请求失败，请检查网络连接');
      }
      throw error;
    }
  }

  /**
   * 获取文件的 SHA
   */
  private async getFileSha(
    owner: string,
    repo: string,
    path: string,
    branch: string
  ): Promise<string | null> {
    try {
      const pathWithRef = `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
      const response = await this.makeRequest('GET', pathWithRef);

      if (!response || Array.isArray(response)) {
        return null;
      }

      return response.sha || null;
    } catch (error: any) {
      if (error.message.includes('404') || error.message.includes('401')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * 上传图片到 Gitee
   */
  async uploadImage(uploadData: {
    uri: string;
    name?: string;
    description?: string;
    tags?: string[];
  }): Promise<ImageItem> {
    try {
      const { uri, name, description, tags } = uploadData;
      const fileName = name || uri.split('/').pop() || 'image.jpg';
      const filePath = `${this.config.path}/${fileName}`;

      // 将文件转换为 base64
      const base64Content = await this.uriToBase64(uri);

      // 检查文件是否已存在
      const existingSha = await this.getFileSha(
        this.config.owner,
        this.config.repo,
        filePath,
        this.config.branch
      );

      const requestBody: any = {
        message: existingSha
          ? `Update image: ${fileName}`
          : `Add image: ${fileName}`,
        content: base64Content,
        branch: this.config.branch,
      };

      if (existingSha) {
        requestBody.sha = existingSha;
      }

      // 上传文件
      const response = await this.makeRequest(
        'POST',
        `/repos/${this.config.owner}/${this.config.repo}/contents/${encodeURIComponent(filePath)}`,
        requestBody
      );

      // 使用 raw URL 替代 API 返回的 download_url，避免跨域问题
      const rawUrl = this.getRawUrl(
        this.config.owner,
        this.config.repo,
        this.config.branch,
        filePath
      );

      // 获取图片信息
      const imageInfo = await this.getImageInfo(uri);
      let fileSize = 0;
      try {
        const sizeResponse = await fetch(uri, { method: 'HEAD' });
        const contentLength = sizeResponse.headers.get('content-length');
        if (contentLength) {
          fileSize = parseInt(contentLength, 10);
        }
      } catch {
        // 忽略错误，使用默认值 0
      }

      const imageSha = response.content?.sha;
      const imageId =
        imageSha || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const imageItem: ImageItem = {
        id: imageId,
        name: fileName,
        url: rawUrl,
        githubUrl: response.content?.html_url || '',
        size: fileSize,
        width: imageInfo.width,
        height: imageInfo.height,
        type: this.getMimeType(fileName),
        tags: tags || [],
        description: description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 构建元数据对象
      const metadata = {
        id: imageId,
        name: fileName,
        description: description || '',
        tags: tags || [],
        size: fileSize,
        width: imageInfo.width,
        height: imageInfo.height,
        createdAt: imageItem.createdAt,
        updatedAt: imageItem.updatedAt,
      };

      // 同时上传元数据文件
      try {
        const metadataFileName = this.getMetadataFileName(fileName);
        const metadataPath = `${this.config.path}/.metadata/${metadataFileName}`;
        const metadataContent = JSON.stringify(metadata, null, 2);

        // 检查元数据文件是否已存在
        const metadataSha = await this.getFileSha(
          this.config.owner,
          this.config.repo,
          metadataPath,
          this.config.branch
        );

        // 将字符串转换为 base64（移动端不支持 Buffer）
        const base64Content = btoa(
          unescape(encodeURIComponent(metadataContent))
        );

        const metadataRequestBody: any = {
          message: metadataSha
            ? `Update metadata for: ${fileName}`
            : `Create metadata for: ${fileName}`,
          content: base64Content,
          branch: this.config.branch,
        };

        if (metadataSha) {
          metadataRequestBody.sha = metadataSha;
        }

        // 根据文件是否存在选择使用 POST 或 PUT 方法
        if (metadataSha) {
          await this.makeRequest(
            'PUT',
            `/repos/${this.config.owner}/${this.config.repo}/contents/${encodeURIComponent(metadataPath)}`,
            metadataRequestBody
          );
        } else {
          await this.makeRequest(
            'POST',
            `/repos/${this.config.owner}/${this.config.repo}/contents/${encodeURIComponent(metadataPath)}`,
            metadataRequestBody
          );
        }

        // 更新本地缓存
        await MetadataCache.updateCachedMetadata(
          fileName,
          MetadataCache.imageItemToMetadata(imageItem),
          'gitee',
          this.config.owner,
          this.config.repo
        );
      } catch (metadataError) {
        console.warn(
          'Image file uploaded successfully, but metadata upload failed:',
          metadataError
        );
      }

      return imageItem;
    } catch (error) {
      console.error('Upload image failed:', error);
      throw new Error(
        `上传图片失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 删除图片
   */
  async deleteImage(imageId: string, fileName: string): Promise<void> {
    try {
      const filePath = `${this.config.path}/${fileName}`;

      // 获取文件 SHA
      const sha = await this.getFileSha(
        this.config.owner,
        this.config.repo,
        filePath,
        this.config.branch
      );

      if (!sha) {
        throw new Error('文件不存在');
      }

      // 删除文件
      await this.makeRequest(
        'DELETE',
        `/repos/${this.config.owner}/${this.config.repo}/contents/${encodeURIComponent(filePath)}`,
        {
          message: `Delete image: ${fileName}`,
          sha,
          branch: this.config.branch,
        }
      );

      // 删除元数据文件
      try {
        await this.deleteImageMetadata(fileName);
      } catch (error) {
        console.warn('Failed to delete metadata file:', error);
      }
    } catch (error) {
      console.error('Delete image failed:', error);
      throw new Error(
        `删除图片失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 删除图片元数据文件
   */
  private async deleteImageMetadata(fileName: string): Promise<void> {
    try {
      const metadataFileName = this.getMetadataFileName(fileName);
      const metadataFilePath = `${this.config.path}/.metadata/${metadataFileName}`;

      const metadataSha = await this.getFileSha(
        this.config.owner,
        this.config.repo,
        metadataFilePath,
        this.config.branch
      );

      if (!metadataSha) {
        return;
      }

      // 删除元数据文件
      await this.makeRequest(
        'DELETE',
        `/repos/${this.config.owner}/${this.config.repo}/contents/${encodeURIComponent(metadataFilePath)}`,
        {
          message: `Delete metadata for image: ${fileName}`,
          sha: metadataSha,
          branch: this.config.branch,
        }
      );

      // 从本地缓存删除
      await MetadataCache.removeCachedMetadata(
        fileName,
        'gitee',
        this.config.owner,
        this.config.repo
      );
    } catch (error) {
      console.warn(`Failed to delete metadata for ${fileName}:`, error);
    }
  }

  /**
   * 获取元数据文件名
   */
  private getMetadataFileName(fileName: string): string {
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const extension = fileName.substring(fileName.lastIndexOf('.'));
    return `${nameWithoutExt}.metadata${extension}.json`;
  }

  /**
   * 获取图片元数据
   */
  private async getImageMetadata(fileName: string): Promise<any | null> {
    try {
      const metadataFileName = this.getMetadataFileName(fileName);
      // 使用 Gitee raw URL 直接获取文件内容
      const metadataUrl = this.getRawUrl(
        this.config.owner,
        this.config.repo,
        this.config.branch,
        `${this.config.path}/.metadata/${metadataFileName}`
      );

      const response = await fetch(metadataUrl);

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
   * 批量加载元数据
   */
  private async loadMetadataBatch(
    imageFiles: any[],
    batchSize: number = 5,
    maxRetries: number = 2
  ): Promise<Map<string, any>> {
    const metadataMap = new Map<string, any>();

    for (let i = 0; i < imageFiles.length; i += batchSize) {
      const batch = imageFiles.slice(i, i + batchSize);
      const batchPromises = batch.map(async item => {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            const metadata = await this.getImageMetadata(item.name);
            if (metadata) {
              return { fileName: item.name, metadata };
            }
            return null;
          } catch (error) {
            lastError =
              error instanceof Error ? error : new Error(String(error));
            if (attempt < maxRetries) {
              await new Promise(resolve =>
                setTimeout(resolve, Math.pow(2, attempt) * 100)
              );
              continue;
            }
          }
        }

        return null;
      });

      const results = await Promise.all(batchPromises);
      results.forEach(result => {
        if (result) {
          metadataMap.set(result.fileName, result.metadata);
        }
      });
    }

    return metadataMap;
  }

  /**
   * 获取图片列表
   */
  async getImageList(): Promise<ImageItem[]> {
    try {
      const response = await this.makeRequest(
        'GET',
        `/repos/${this.config.owner}/${this.config.repo}/contents/${encodeURIComponent(this.config.path)}?ref=${this.config.branch}`
      );

      if (!Array.isArray(response)) {
        return [];
      }

      // 筛选出图片文件
      const imageFiles = response.filter((item: any) =>
        this.isImageFile(item.name)
      );

      if (imageFiles.length === 0) {
        return [];
      }

      // 快速返回基础图片列表
      const images: ImageItem[] = imageFiles.map((item: any) => ({
        id: item.sha,
        name: item.name,
        url: this.getRawUrl(
          this.config.owner,
          this.config.repo,
          this.config.branch,
          `${this.config.path}/${item.name}`
        ),
        githubUrl: item.html_url || '',
        size: item.size || 0,
        width: 0,
        height: 0,
        type: this.getMimeType(item.name),
        tags: [],
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      // 检查重复ID
      const idCounts = images.reduce(
        (acc: Record<string, number>, img: ImageItem) => {
          acc[img.id] = (acc[img.id] || 0) + 1;
          return acc;
        },
        {}
      );

      const duplicateIds = Object.entries(idCounts).filter(
        ([_, count]) => count > 1
      );
      if (duplicateIds.length > 0) {
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

      // 异步加载元数据（不阻塞主流程）
      this.loadMetadataBatch(imageFiles)
        .then(metadataMap => {
          // 更新图片列表的元数据
          images.forEach(img => {
            const metadata = metadataMap.get(img.name);
            if (metadata) {
              img.width = metadata.width || 0;
              img.height = metadata.height || 0;
              img.size = metadata.size || img.size || 0;
              img.tags = metadata.tags || [];
              img.description = metadata.description || '';
              img.updatedAt = metadata.updatedAt || img.updatedAt;
              img.createdAt = metadata.createdAt || img.createdAt;

              // 更新本地缓存
              MetadataCache.updateCachedMetadata(
                img.name,
                MetadataCache.imageItemToMetadata(img),
                'gitee',
                this.config.owner,
                this.config.repo
              );
            }
          });
        })
        .catch(error => {
          console.warn('Failed to load metadata batch:', error);
        });

      return images;
    } catch (error) {
      console.error('Get image list failed:', error);
      throw new Error(
        `获取图片列表失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 异步加载图片元数据并更新图片列表（优化版：支持缓存和增量更新）
   * @param images 图片列表
   * @param options 加载选项
   * @param options.forceRefresh 强制刷新，忽略缓存
   * @param options.backgroundUpdate 后台更新，使用缓存但后台检查更新
   */
  async loadImageMetadata(
    images: ImageItem[],
    options?: { forceRefresh?: boolean; backgroundUpdate?: boolean }
  ): Promise<ImageItem[]> {
    try {
      const { forceRefresh = false, backgroundUpdate = true } = options || {};

      // 创建文件名到图片的映射
      const fileNameMap = new Map<string, ImageItem>();
      images.forEach(img => {
        fileNameMap.set(img.name, img);
      });

      const fileNames = Array.from(fileNameMap.keys());

      // 1. 如果强制刷新，跳过缓存直接加载
      if (forceRefresh) {
        const remoteMetadataMap = await this.loadMetadataBatch(
          fileNames.map(name => ({ name })),
          5
        );

        // 更新缓存
        const metadataToCache = new Map();
        remoteMetadataMap.forEach((metadata, fileName) => {
          const metadataWithTimestamp = {
            ...metadata,
            cacheTimestamp: Date.now(),
          };
          metadataToCache.set(fileName, metadataWithTimestamp);
        });
        await MetadataCache.updateCachedMetadataBatch(
          metadataToCache,
          'gitee',
          this.config.owner,
          this.config.repo
        );

        // 合并远程数据
        return images.map(img => {
          const remote = remoteMetadataMap.get(img.name);
          if (remote) {
            return MetadataCache.mergeMetadataToImage(img, remote);
          }
          return img;
        });
      }

      // 2. 先从缓存加载
      const cachedMetadata = await MetadataCache.getCachedMetadataBatch(
        fileNames,
        'gitee',
        this.config.owner,
        this.config.repo
      );

      // 3. 合并缓存数据到图片列表（立即返回，不等待远程）
      let updatedImages = images.map(img => {
        const cached = cachedMetadata.get(img.name);
        if (cached) {
          return MetadataCache.mergeMetadataToImage(img, cached);
        }
        return img;
      });

      // 4. 找出需要从远程加载的文件
      // 如果启用后台更新，只加载真正需要更新的（无效或缺失的）
      // 如果禁用后台更新，只加载缺失的（缓存中没有的）
      const filesToFetch = backgroundUpdate
        ? await MetadataCache.getFilesToUpdate(
            fileNames,
            undefined,
            'gitee',
            this.config.owner,
            this.config.repo
          )
        : fileNames.filter(fileName => !cachedMetadata.has(fileName));

      // 5. 如果有需要更新的文件，从远程加载（后台异步）
      if (filesToFetch.length > 0) {
        // 后台异步加载，不阻塞返回
        this.loadMetadataBatch(
          filesToFetch.map(name => ({ name })),
          5
        )
          .then(async remoteMetadataMap => {
            // 更新缓存
            const metadataToCache = new Map();
            remoteMetadataMap.forEach((metadata, fileName) => {
              const metadataWithTimestamp = {
                ...metadata,
                cacheTimestamp: Date.now(),
              };
              metadataToCache.set(fileName, metadataWithTimestamp);
            });
            await MetadataCache.updateCachedMetadataBatch(
              metadataToCache,
              'gitee',
              this.config.owner,
              this.config.repo
            );

            // 注意：这里不更新 images，因为已经返回了
            // 如果需要实时更新，可以通过回调或事件通知
          })
          .catch(error => {
            console.debug('Background metadata update failed:', error);
            // 后台更新失败不影响已返回的数据
          });
      }

      // 6. 立即返回（使用缓存数据）
      return updatedImages;
    } catch (error) {
      console.error('Load image metadata failed:', error);
      // 即使加载元数据失败，也返回原始图片列表（可能包含缓存数据）
      return images;
    }
  }

  /**
   * 更新图片信息
   */
  async updateImageInfo(
    imageId: string,
    fileName: string,
    metadata: any,
    oldFileName?: string
  ): Promise<void> {
    try {
      const metadataToUpdate = {
        id: metadata.id || imageId,
        name: metadata.name || fileName,
        description: metadata.description || '',
        tags: metadata.tags || [],
        size: metadata.size || 0,
        width: metadata.width || 0,
        height: metadata.height || 0,
        updatedAt: metadata.updatedAt || new Date().toISOString(),
        createdAt: metadata.createdAt || new Date().toISOString(),
      };

      const targetFileName = oldFileName || fileName;
      const metadataFileName = this.getMetadataFileName(targetFileName);
      const metadataPath = `${this.config.path}/.metadata/${metadataFileName}`;
      const metadataContent = JSON.stringify(metadataToUpdate, null, 2);

      // 检查元数据文件是否已存在
      const metadataSha = await this.getFileSha(
        this.config.owner,
        this.config.repo,
        metadataPath,
        this.config.branch
      );

      // 将字符串转换为 base64（移动端不支持 Buffer）
      const base64Content = btoa(unescape(encodeURIComponent(metadataContent)));

      const requestBody: any = {
        message: metadataSha
          ? `Update metadata for: ${metadata.name}`
          : `Create metadata for: ${metadata.name}`,
        content: base64Content,
        branch: this.config.branch,
      };

      if (metadataSha) {
        requestBody.sha = metadataSha;
      }

      // 根据文件是否存在选择使用 POST 或 PUT 方法
      if (metadataSha) {
        await this.makeRequest(
          'PUT',
          `/repos/${this.config.owner}/${this.config.repo}/contents/${encodeURIComponent(metadataPath)}`,
          requestBody
        );
      } else {
        await this.makeRequest(
          'POST',
          `/repos/${this.config.owner}/${this.config.repo}/contents/${encodeURIComponent(metadataPath)}`,
          requestBody
        );
      }

      // 更新本地缓存
      await MetadataCache.updateCachedMetadata(
        fileName,
        MetadataCache.imageItemToMetadata(metadataToUpdate as ImageItem),
        'gitee',
        this.config.owner,
        this.config.repo
      );
    } catch (error) {
      console.error('Update image info failed:', error);
      throw new Error(
        `更新图片信息失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }
}
