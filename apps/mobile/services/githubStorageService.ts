import { ImageItem, GitHubConfig, ImageUploadData } from 'pixuli-common/src';
import { Octokit } from 'octokit';
import { getImageInfoFromUri } from '../utils/imageUtils';
import { MetadataCache } from '../utils/metadataCache';

export class GitHubStorageService {
  private config: GitHubConfig;
  private octokit: Octokit;

  constructor(config: GitHubConfig) {
    this.config = config;
    this.octokit = new Octokit({ auth: config.token });
  }

  /**
   * 将文件 URI 转换为 base64
   */
  private async uriToBase64(uri: string): Promise<string> {
    try {
      // 使用 fetch 获取文件并转换为 base64
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
   * 上传图片到 GitHub
   */
  async uploadImage(uploadData: {
    uri: string;
    name?: string;
    description?: string;
    tags?: string[];
  }): Promise<ImageItem> {
    try {
      const { uri, name, description, tags } = uploadData;
      // 从 URI 中提取文件名
      const fileName = name || uri.split('/').pop() || 'image.jpg';
      const filePath = `${this.config.path}/${fileName}`;

      // 将文件转换为 base64
      const base64Content = await this.uriToBase64(uri);

      // 检查文件是否已存在
      let existingSha: string | null = null;
      try {
        const existingFile = await this.octokit.rest.repos.getContent({
          owner: this.config.owner,
          repo: this.config.repo,
          path: filePath,
          ref: this.config.branch,
        });

        if (!Array.isArray(existingFile.data) && 'sha' in existingFile.data) {
          existingSha = existingFile.data.sha;
        }
      } catch (error: any) {
        // 如果文件不存在，existingSha 保持为 null
        if (error.status !== 404) {
          console.warn('Error checking existing file:', error.message);
        }
      }

      // 上传文件
      const response = await this.octokit.rest.repos.createOrUpdateFileContents(
        {
          owner: this.config.owner,
          repo: this.config.repo,
          path: filePath,
          message: existingSha
            ? `Update image: ${fileName}`
            : `Add image: ${fileName}`,
          content: base64Content,
          branch: this.config.branch,
          ...(existingSha && { sha: existingSha }),
        }
      );

      // 获取图片信息
      const imageInfo = await this.getImageInfo(uri);
      // 尝试获取文件大小（如果无法获取，使用 0）
      let fileSize = 0;
      try {
        const response = await fetch(uri, { method: 'HEAD' });
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          fileSize = parseInt(contentLength, 10);
        }
      } catch {
        // 忽略错误，使用默认值 0
      }

      const imageId =
        response.data.content?.sha ||
        `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const imageItem: ImageItem = {
        id: imageId,
        name: fileName,
        url: response.data.content?.download_url || '',
        githubUrl: response.data.content?.html_url || '',
        size: fileSize,
        width: imageInfo.width,
        height: imageInfo.height,
        type: this.getMimeType(fileName),
        tags: tags || [],
        description: description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 上传元数据文件
      try {
        await this.uploadImageMetadata(fileName, imageItem);
        // 更新本地缓存
        await MetadataCache.updateCachedMetadata(
          fileName,
          MetadataCache.imageItemToMetadata(imageItem),
          'github',
          this.config.owner,
          this.config.repo
        );
      } catch (error) {
        console.warn(
          'Image file uploaded successfully, but metadata upload failed:',
          error
        );
        // 元数据上传失败不应该阻止整个上传流程
        // 可以稍后更新元数据或从图片 URL 获取
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
      const file = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: filePath,
        ref: this.config.branch,
      });

      if (Array.isArray(file.data)) {
        throw new Error('Path is a directory');
      }

      // 删除文件
      await this.octokit.rest.repos.deleteFile({
        owner: this.config.owner,
        repo: this.config.repo,
        path: filePath,
        message: `Delete image: ${fileName}`,
        sha: file.data.sha,
        branch: this.config.branch,
      });

      // 删除元数据文件
      try {
        await this.deleteImageMetadata(fileName);
      } catch (error) {
        console.warn('Failed to delete metadata file:', error);
        // 元数据删除失败不应该阻止整个删除流程
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

      let metadataFileInfo: any;
      try {
        const metadataResponse = await this.octokit.rest.repos.getContent({
          owner: this.config.owner,
          repo: this.config.repo,
          path: metadataFilePath,
          ref: this.config.branch,
        });

        if (Array.isArray(metadataResponse.data)) {
          // 如果是数组，说明路径是目录，文件不存在
          return;
        }

        metadataFileInfo = metadataResponse.data;
      } catch (error: any) {
        // 如果文件不存在（404），直接返回
        if (error.status === 404) {
          return;
        }
        throw error;
      }

      if (Array.isArray(metadataFileInfo)) {
        return;
      }

      if (!metadataFileInfo.sha) {
        console.warn(`Metadata file exists but no SHA found for ${fileName}`);
        return;
      }

      // 删除元数据文件
      await this.octokit.rest.repos.deleteFile({
        owner: this.config.owner,
        repo: this.config.repo,
        path: metadataFilePath,
        message: `Delete metadata for image: ${fileName}`,
        sha: metadataFileInfo.sha,
        branch: this.config.branch,
      });

      // 从本地缓存删除
      await MetadataCache.removeCachedMetadata(
        fileName,
        'github',
        this.config.owner,
        this.config.repo
      );
    } catch (error) {
      console.warn(`Failed to delete metadata for ${fileName}:`, error);
      throw new Error(`Failed to delete metadata for ${fileName}: ${error}`);
    }
  }

  /**
   * 获取元数据文件名
   */
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
      // 使用 raw.githubusercontent.com 直接获取文件内容
      // URL格式：https://raw.githubusercontent.com/owner/repo/refs/heads/branch/path/.metadata/file.json
      const metadataUrl = `https://raw.githubusercontent.com/${this.config.owner}/${this.config.repo}/refs/heads/${this.config.branch}/${this.config.path}/.metadata/${metadataFileName}`;

      const response = await fetch(metadataUrl);

      // 如果文件不存在（404），返回 null
      if (response.status === 404) {
        console.debug(`Metadata file not found for ${fileName} (404)`);
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.status}`);
      }

      const metadataContent = await response.json();
      return metadataContent;
    } catch (error) {
      // 如果是已知的404错误，直接返回null
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      console.debug(`Failed to get metadata for ${fileName}:`, error);
      return null;
    }
  }

  /**
   * 批量加载元数据（限制并发数，支持重试）
   */
  private async loadMetadataBatch(
    imageFiles: any[],
    batchSize: number = 5,
    maxRetries: number = 2
  ): Promise<Map<string, any>> {
    const metadataMap = new Map<string, any>();

    // 分批处理，限制并发数
    for (let i = 0; i < imageFiles.length; i += batchSize) {
      const batch = imageFiles.slice(i, i + batchSize);
      const batchPromises = batch.map(async item => {
        let lastError: Error | null = null;

        // 重试机制
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
              // 指数退避：等待时间 = 2^attempt * 100ms
              await new Promise(resolve =>
                setTimeout(resolve, Math.pow(2, attempt) * 100)
              );
              continue;
            }
          }
        }

        // 所有重试都失败
        console.debug(
          `Failed to fetch metadata for ${item.name} after ${maxRetries + 1} attempts:`,
          lastError
        );
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
   * 获取图片列表（快速返回，不等待元数据）
   */
  async getImageList(): Promise<ImageItem[]> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: this.config.path,
        ref: this.config.branch,
      });

      if (!Array.isArray(response.data)) {
        return [];
      }

      // 筛选出图片文件
      const imageFiles = response.data.filter(
        item => this.isImageFile(item.name) && item.type === 'file'
      );

      if (imageFiles.length === 0) {
        return [];
      }

      // 快速返回基础图片列表（不等待元数据）
      const images: ImageItem[] = imageFiles.map(item => ({
        id: item.sha,
        name: item.name,
        url: item.download_url || '',
        githubUrl: item.html_url || '',
        size: item.size || 0,
        width: 0, // 初始设为0，后续通过异步加载元数据更新
        height: 0,
        type: this.getMimeType(item.name),
        tags: [], // 初始为空，后续通过异步加载元数据更新
        description: '', // 初始为空，后续通过异步加载元数据更新
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
        console.warn('Found duplicate image IDs:', duplicateIds);
        // 为重复的ID添加后缀以确保唯一性
        const processedImages = images.map((img, index) => {
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
          'github',
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
        'github',
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
            'github',
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
              'github',
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
    metadata: {
      name?: string;
      description?: string;
      tags?: string[];
      updatedAt: string;
    },
    oldFileName?: string
  ): Promise<void> {
    try {
      const filePath = `${this.config.path}/${fileName}`;
      const oldFilePath = oldFileName
        ? `${this.config.path}/${oldFileName}`
        : filePath;

      // 如果文件名改变，需要重命名文件
      if (oldFileName && oldFileName !== fileName) {
        // 获取旧文件内容
        const oldFile = await this.octokit.rest.repos.getContent({
          owner: this.config.owner,
          repo: this.config.repo,
          path: oldFilePath,
          ref: this.config.branch,
        });

        if (Array.isArray(oldFile.data)) {
          throw new Error('Path is a directory');
        }

        // 创建新文件
        if (
          oldFile.data.type === 'file' &&
          'content' in oldFile.data &&
          'encoding' in oldFile.data
        ) {
          await this.octokit.rest.repos.createOrUpdateFileContents({
            owner: this.config.owner,
            repo: this.config.repo,
            path: filePath,
            message: `Rename image: ${oldFileName} -> ${fileName}`,
            content: oldFile.data.content || '',
            branch: this.config.branch,
            encoding: oldFile.data.encoding as 'base64' | 'utf8',
          });
        }

        // 删除旧文件
        await this.octokit.rest.repos.deleteFile({
          owner: this.config.owner,
          repo: this.config.repo,
          path: oldFilePath,
          message: `Delete old image: ${oldFileName}`,
          sha: oldFile.data.sha,
          branch: this.config.branch,
        });
      }

      // 获取现有的元数据（保留尺寸等信息）
      let existingMetadata = null;
      try {
        existingMetadata = await this.getImageMetadata(fileName);
      } catch (error) {
        console.debug(
          `Failed to get existing metadata for ${fileName}:`,
          error
        );
      }

      // 更新元数据文件，保留现有的尺寸等信息
      const updatedMetadata = {
        id: imageId,
        name: metadata.name || fileName,
        description:
          metadata.description ?? existingMetadata?.description ?? '',
        tags: metadata.tags ?? existingMetadata?.tags ?? [],
        size: existingMetadata?.size || 0,
        width: existingMetadata?.width || 0,
        height: existingMetadata?.height || 0,
        updatedAt: metadata.updatedAt,
        createdAt: existingMetadata?.createdAt || new Date().toISOString(),
      };

      await this.updateImageMetadata(fileName, updatedMetadata);

      // 更新本地缓存
      await MetadataCache.updateCachedMetadata(
        fileName,
        updatedMetadata,
        'github',
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

  /**
   * 上传图片元数据文件
   */
  private async uploadImageMetadata(
    fileName: string,
    metadata: ImageItem
  ): Promise<void> {
    await this.updateImageMetadata(fileName, metadata);
  }

  /**
   * 更新图片元数据文件
   */
  private async updateImageMetadata(
    fileName: string,
    metadata: any
  ): Promise<void> {
    try {
      const metadataFileName = this.getMetadataFileName(fileName);
      const metadataFilePath = `${this.config.path}/.metadata/${metadataFileName}`;

      // 构建元数据内容
      const metadataContent = {
        id: metadata.id || fileName,
        name: metadata.name || fileName,
        description: metadata.description || '',
        tags: metadata.tags || [],
        size: metadata.size || 0, // 文件大小（字节）
        width: metadata.width || 0,
        height: metadata.height || 0,
        updatedAt: metadata.updatedAt || new Date().toISOString(),
        createdAt: metadata.createdAt || new Date().toISOString(),
      };

      // 将元数据转换为 base64
      const jsonString = JSON.stringify(metadataContent, null, 2);
      const base64Content = btoa(unescape(encodeURIComponent(jsonString)));

      // 检查元数据文件是否已存在
      let existingSha: string | undefined;
      let fileExists = false;
      try {
        const existingFile = await this.octokit.rest.repos.getContent({
          owner: this.config.owner,
          repo: this.config.repo,
          path: metadataFilePath,
          ref: this.config.branch,
        });

        // 如果返回的是数组（目录内容），说明文件不存在
        if (Array.isArray(existingFile.data)) {
          fileExists = false;
          existingSha = undefined;
        } else if ('sha' in existingFile.data) {
          fileExists = true;
          existingSha = existingFile.data.sha;
        }
      } catch (error: any) {
        // 检查是否是 404 错误（文件不存在）
        if (error.status === 404) {
          fileExists = false;
          existingSha = undefined;
        } else {
          // 其他错误，重新抛出
          throw error;
        }
      }

      // 创建或更新元数据文件
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.config.owner,
        repo: this.config.repo,
        path: metadataFilePath,
        message: fileExists
          ? `Update metadata for image: ${fileName}`
          : `Create metadata for image: ${fileName}`,
        content: base64Content,
        branch: this.config.branch,
        ...(fileExists && existingSha && { sha: existingSha }),
      });
    } catch (error) {
      console.error('Update image metadata failed:', error);
      throw new Error(`更新图片元数据失败: ${error}`);
    }
  }
}
