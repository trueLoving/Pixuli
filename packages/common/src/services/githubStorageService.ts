import type { ImageItem, ImageUploadData } from '../types/image';
import type { GitHubConfig } from '../types/github';
import type { PlatformAdapter } from './giteeStorageService';
import { DefaultPlatformAdapter } from './giteeStorageService';

export class GitHubStorageService {
  private config: GitHubConfig;
  private baseUrl = 'https://api.github.com';
  private platformAdapter: PlatformAdapter;

  constructor(config: GitHubConfig, platformAdapter?: PlatformAdapter) {
    this.config = config;
    this.platformAdapter = platformAdapter || new DefaultPlatformAdapter();
  }

  private async makeGitHubRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Authorization: `token ${this.config.token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Pixuli',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `GitHub API error: ${response.status}`
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
    file: File | string
  ): Promise<{ width: number; height: number }> {
    try {
      return await this.platformAdapter.getImageDimensions(file);
    } catch (error) {
      console.warn(
        'Failed to get image dimensions, using default values:',
        error
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
  private async uploadImageFile(
    file: File | string,
    fileName: string,
    description?: string
  ): Promise<{ sha: string; download_url: string; html_url: string }> {
    // 将文件转换为 base64
    const base64Content = await this.platformAdapter.fileToBase64(file);

    // 构建文件路径
    const filePath = `${this.config.path}/${fileName}`;

    // 调用 GitHub API 上传文件
    const response = await this.makeGitHubRequest(
      `/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          message: `Upload image: ${fileName}${description ? ` - ${description}` : ''}`,
          content: base64Content,
          branch: this.config.branch,
        }),
      }
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
    metadata: ImageItem
  ): Promise<void> {
    try {
      await this.updateImageMetadata(fileName, metadata);
    } catch (error) {
      console.error('Failed to upload metadata:', error);
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
  async uploadImage(
    uploadData:
      | ImageUploadData
      | { uri: string; name?: string; description?: string; tags?: string[] }
  ): Promise<ImageItem> {
    try {
      // 兼容 web/desktop 的 File 和 mobile 的 URI
      const file = 'file' in uploadData ? uploadData.file : uploadData.uri;
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
        description
      );

      // ========== 构建图片元数据对象 ==========
      // 包含所有元数据信息：尺寸、标签、描述等
      const imageItem: ImageItem = {
        id:
          uploadResponse.sha ||
          `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: fileName,
        url: uploadResponse.download_url,
        githubUrl: uploadResponse.html_url,
        size: fileSize,
        width: imageDimensions.width,
        height: imageDimensions.height,
        type: mimeType,
        tags: tags || [],
        description: description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // ========== 步骤2：上传图片元数据 ==========
      // 将包含尺寸信息的元数据上传到 GitHub
      try {
        await this.uploadImageMetadata(fileName, imageItem);
      } catch (error) {
        // 元数据上传失败时，记录警告但不影响图片上传的成功
        // 因为图片文件已经成功上传，元数据可以在后续补充
        console.warn(
          'Image file uploaded successfully, but metadata upload failed:',
          error
        );
        console.warn(
          'You can update metadata later or it will be fetched from the image URL'
        );
      }

      return imageItem;
    } catch (error) {
      console.error('Upload image failed:', error);
      throw new Error(`上传图片失败: ${error}`);
    }
  }

  // 删除图片
  async deleteImage(_imageId: string, fileName: string): Promise<void> {
    try {
      const filePath = `${this.config.path}/${fileName}`;

      // 首先获取文件的SHA
      const fileInfo = await this.makeGitHubRequest(
        `/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}?ref=${this.config.branch}`
      );

      // 删除文件
      await this.makeGitHubRequest(
        `/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}`,
        {
          method: 'DELETE',
          body: JSON.stringify({
            message: `Delete image: ${fileName}`,
            sha: fileInfo.sha,
            branch: this.config.branch,
          }),
        }
      );

      // 删除对应的元数据文件
      try {
        await this.deleteImageMetadata(fileName);
      } catch (error) {
        console.warn('Failed to delete metadata file:', error);
        // 不抛出错误，因为图片已经删除成功
      }
    } catch (error) {
      console.error('Delete image failed:', error);
      throw new Error(`删除图片失败: ${error}`);
    }
  }

  // 删除图片元数据文件
  private async deleteImageMetadata(fileName: string): Promise<void> {
    try {
      const metadataFileName = this.getMetadataFileName(fileName);
      const metadataFilePath = `${this.config.path}/.metadata/${metadataFileName}`;

      // 检查元数据文件是否存在
      let metadataFileInfo: any;
      try {
        metadataFileInfo = await this.makeGitHubRequest(
          `/repos/${this.config.owner}/${this.config.repo}/contents/${metadataFilePath}?ref=${this.config.branch}`
        );
      } catch (error: any) {
        // 如果文件不存在（404错误），直接返回，不需要删除
        const errorMessage = error?.message || '';
        const isNotFound =
          errorMessage.includes('404') ||
          errorMessage.includes('Not Found') ||
          errorMessage.includes('does not exist');

        if (isNotFound) {
          // 元数据文件不存在，无需删除
          return;
        }
        // 其他错误，重新抛出
        throw error;
      }

      // 如果返回的是数组（目录内容），说明文件不存在
      if (Array.isArray(metadataFileInfo)) {
        return;
      }

      // 确保获取到了 SHA
      if (!metadataFileInfo.sha) {
        console.warn(`Metadata file exists but no SHA found for ${fileName}`);
        return;
      }

      // 删除元数据文件
      await this.makeGitHubRequest(
        `/repos/${this.config.owner}/${this.config.repo}/contents/${metadataFilePath}`,
        {
          method: 'DELETE',
          body: JSON.stringify({
            message: `Delete metadata for image: ${fileName}`,
            sha: metadataFileInfo.sha,
            branch: this.config.branch,
          }),
        }
      );
    } catch (error) {
      // 删除元数据失败不应该阻止图片删除，只记录警告
      console.warn(`Failed to delete metadata for ${fileName}:`, error);
      throw new Error(`Failed to delete metadata for ${fileName}: ${error}`);
    }
  }

  // 获取图片列表
  async getImageList(): Promise<ImageItem[]> {
    try {
      const response = await this.makeGitHubRequest(
        `/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.path}?ref=${this.config.branch}`
      );

      // 过滤出图片文件
      const imageFiles = response.filter(
        (item: any) => this.isImageFile(item.name) && item.type === 'file'
      );

      const images = await Promise.all(
        imageFiles.map(async (item: any) => {
          // 尝试从元数据文件获取详细信息
          let metadata = null;
          try {
            metadata = await this.getImageMetadata(item.name);
          } catch (error) {
            // 其他错误，记录debug日志
            console.debug(`Failed to fetch metadata for ${item.name}:`, error);
          }

          return {
            id: metadata?.id || item.sha,
            name: metadata?.name || item.name,
            url: item.download_url || '',
            githubUrl: item.html_url || '',
            size: metadata?.size || item.size || 0, // 优先从元数据读取，备选 GitHub API
            width: metadata?.width || 0, // 初始设为0，后续通过懒加载获取
            height: metadata?.height || 0, // 初始设为0，后续通过懒加载获取
            type: this.getMimeType(item.name),
            tags: metadata?.tags || [], // 从元数据文件获取标签
            description: metadata?.description || '', // 从元数据文件获取描述
            createdAt: metadata?.createdAt || new Date().toISOString(),
            updatedAt: metadata?.updatedAt || new Date().toISOString(),
          };
        })
      );

      // 检查重复ID
      const idCounts = images.reduce(
        (acc: Record<string, number>, img: ImageItem) => {
          acc[img.id] = (acc[img.id] || 0) + 1;
          return acc;
        },
        {}
      );

      const duplicateIds = Object.entries(idCounts).filter(
        ([_, count]) => (count as number) > 1
      );
      if (duplicateIds.length > 0) {
        console.warn('发现重复的图片ID:', duplicateIds);
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
      console.error('Get image list failed:', error);
      throw new Error(`获取图片列表失败: ${error}`);
    }
  }

  // 更新图片信息（如标签、描述等）
  async updateImageInfo(
    _imageId: string,
    fileName: string,
    metadata: any
  ): Promise<void> {
    try {
      // 更新元数据文件
      await this.updateImageMetadata(fileName, metadata);
    } catch (error) {
      console.error('Update image info failed:', error);
      throw new Error(`更新图片信息失败: ${error}`);
    }
  }

  // 更新图片元数据文件
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
        const existingFile = await this.makeGitHubRequest(
          `/repos/${this.config.owner}/${this.config.repo}/contents/${metadataFilePath}?ref=${this.config.branch}`
        );
        // 如果返回的是数组（目录内容），说明文件不存在
        if (Array.isArray(existingFile)) {
          fileExists = false;
          existingSha = undefined;
        } else if (existingFile.sha) {
          fileExists = true;
          existingSha = existingFile.sha;
        }
      } catch (error: any) {
        // 检查是否是 404 错误（文件不存在）
        const errorMessage = error?.message || '';
        const isNotFound =
          errorMessage.includes('404') ||
          errorMessage.includes('Not Found') ||
          errorMessage.includes('does not exist');

        if (isNotFound) {
          fileExists = false;
          existingSha = undefined;
        } else {
          // 其他错误，重新抛出
          throw error;
        }
      }

      // 构建请求体
      const requestBody: any = {
        message: fileExists
          ? `Update metadata for image: ${fileName}`
          : `Create metadata for image: ${fileName}`,
        content: base64Content,
        branch: this.config.branch,
      };

      // 只有在文件存在且 SHA 有效时才传递 sha
      // 创建新文件时不应该传递 sha
      if (fileExists && existingSha && existingSha.length > 0) {
        requestBody.sha = existingSha;
      }

      // 创建或更新元数据文件
      try {
        await this.makeGitHubRequest(
          `/repos/${this.config.owner}/${this.config.repo}/contents/${metadataFilePath}`,
          {
            method: 'PUT',
            body: JSON.stringify(requestBody),
          }
        );
      } catch (error: any) {
        // 如果错误是因为 SHA 不匹配，重新获取最新的 SHA 并重试
        const errorMessage = error?.message || '';
        if (errorMessage.includes('does not match') && fileExists) {
          try {
            // 重新获取最新的 SHA
            const latestFile = await this.makeGitHubRequest(
              `/repos/${this.config.owner}/${this.config.repo}/contents/${metadataFilePath}?ref=${this.config.branch}`
            );
            if (latestFile.sha) {
              // 使用最新的 SHA 重试
              const retryRequestBody = {
                message: `Update metadata for image: ${fileName}`,
                content: base64Content,
                sha: latestFile.sha,
                branch: this.config.branch,
              };
              await this.makeGitHubRequest(
                `/repos/${this.config.owner}/${this.config.repo}/contents/${metadataFilePath}`,
                {
                  method: 'PUT',
                  body: JSON.stringify(retryRequestBody),
                }
              );
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
      console.error('Update image metadata failed:', error);
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

  // 获取图片元数据
  private async getImageMetadata(fileName: string): Promise<any | null> {
    try {
      const metadataFileName = this.getMetadataFileName(fileName);
      // 使用 raw.githubusercontent.com 直接获取文件内容
      // URL格式：https://raw.githubusercontent.com/owner/repo/refs/heads/branch/path/.metadata/file.json
      const metadataUrl = `https://raw.githubusercontent.com/${this.config.owner}/${this.config.repo}/refs/heads/${this.config.branch}/${this.config.path}/.metadata/${metadataFileName}`;

      const response = await fetch(metadataUrl);

      // 如果文件不存在（404），记录警告而不是错误
      if (response.status === 404) {
        console.warn(`Metadata file not found for ${fileName} (404)`);
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
      throw new Error(`Failed to get metadata for ${fileName}: ${error}`);
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
    _options?: { forceRefresh?: boolean; backgroundUpdate?: boolean }
  ): Promise<ImageItem[]> {
    try {
      // const { forceRefresh = false } = options || {};

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
          console.debug(`Failed to load metadata for ${img.name}:`, error);
          return img;
        }
      });

      return await Promise.all(metadataPromises);
    } catch (error) {
      console.error('Load image metadata failed:', error);
      // 即使加载元数据失败，也返回原始图片列表
      return images;
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
