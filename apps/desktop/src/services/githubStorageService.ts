import { ImageItem, GitHubConfig, ImageUploadData } from '@packages/ui/src';

export class GitHubStorageService {
  private config: GitHubConfig;

  constructor(config: GitHubConfig) {
    this.config = config;
    // 设置 GitHub 认证
    this.setAuth();
  }

  private async setAuth() {
    try {
      await window.githubAPI.githubSetAuth(this.config.token);
    } catch (error) {
      console.error('Failed to set GitHub auth:', error);
    }
  }

  // 上传图片到 GitHub
  async uploadImage(uploadData: ImageUploadData): Promise<ImageItem> {
    try {
      const { file, name, description, tags } = uploadData;
      const fileName = name || file.name;

      // ========== 准备阶段：获取图片尺寸信息 ==========
      // 在上传前获取图片尺寸，作为元数据的一部分
      let imageDimensions = { width: 0, height: 0 };
      try {
        imageDimensions = await this.getImageInfo(file);
      } catch (error) {
        console.warn(
          'Failed to get image dimensions, using default values:',
          error
        );
        // 如果获取尺寸失败，使用默认值 0，后续可以通过 URL 获取
      }

      // 将文件转换为 base64
      const base64Content = await this.fileToBase64(file);

      // ========== 步骤1：上传图片文件 ==========
      // 通过 IPC 调用主进程的 GitHub 上传功能
      const response = await window.githubAPI.githubUpload({
        owner: this.config.owner,
        repo: this.config.repo,
        path: this.config.path,
        branch: this.config.branch,
        fileName,
        content: base64Content,
        description,
        tags,
      });

      // ========== 构建图片元数据对象 ==========
      // 包含所有元数据信息：尺寸、标签、描述等
      const imageItem: ImageItem = {
        id:
          response.sha ||
          `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: fileName,
        url: response.downloadUrl || '',
        githubUrl: response.htmlUrl || '',
        size: file.size,
        width: imageDimensions.width,
        height: imageDimensions.height,
        type: file.type,
        tags: tags || [],
        description: description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // ========== 步骤2：上传图片元数据 ==========
      // 将包含尺寸信息的元数据上传到 GitHub
      try {
        await this.updateImageInfo(imageItem.id, fileName, imageItem);
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
  async deleteImage(imageId: string, fileName: string): Promise<void> {
    try {
      await window.githubAPI.githubDelete({
        owner: this.config.owner,
        repo: this.config.repo,
        path: this.config.path,
        branch: this.config.branch,
        fileName,
      });
    } catch (error) {
      console.error('Delete image failed:', error);
      throw new Error(`删除图片失败: ${error}`);
    }
  }

  // 获取图片列表
  async getImageList(): Promise<ImageItem[]> {
    try {
      const response = await window.githubAPI.githubGetList({
        owner: this.config.owner,
        repo: this.config.repo,
        path: this.config.path,
        branch: this.config.branch,
      });

      const images = response.map((item: any) => ({
        id: item.sha,
        name: item.name,
        url: item.downloadUrl || '',
        githubUrl: item.htmlUrl || '',
        size: item.size || 0, // 优先从元数据读取，备选 GitHub API
        width: item.width || 0, // 从元数据读取，如果没有则从 URL 获取
        height: item.height || 0, // 从元数据读取，如果没有则从 URL 获取
        type: this.getMimeType(item.name),
        tags: item.tags || [],
        description: item.description || '',
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      }));

      // 检查重复ID
      const idCounts = images.reduce(
        (acc: Record<string, number>, img: any) => {
          acc[img.id] = (acc[img.id] || 0) + 1;
          return acc;
        },
        {}
      );

      const duplicateIds = Object.entries(idCounts).filter(
        ([_, count]) => (count as number) > 1
      );
      if (duplicateIds.length > 0) {
        console.warn('Found duplicate image IDs:', duplicateIds);
        // 为重复的ID添加后缀以确保唯一性
        const processedImages = images.map((img: any, index: number) => {
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
    imageId: string,
    fileName: string,
    metadata: any,
    oldFileName?: string
  ): Promise<void> {
    try {
      // 确保元数据包含 size, width, height 字段
      const metadataToUpdate = {
        id: metadata.id || imageId,
        name: metadata.name || fileName,
        description: metadata.description || '',
        tags: metadata.tags || [],
        size: metadata.size || 0, // 文件大小（字节）
        width: metadata.width || 0,
        height: metadata.height || 0,
        updatedAt: metadata.updatedAt || new Date().toISOString(),
        createdAt: metadata.createdAt || new Date().toISOString(),
      };

      await window.githubAPI.githubUpdateMetadata({
        owner: this.config.owner,
        repo: this.config.repo,
        path: this.config.path,
        branch: this.config.branch,
        fileName,
        metadata: metadataToUpdate,
        oldFileName,
      });
    } catch (error) {
      console.error('Update image info failed:', error);
      throw new Error(`更新图片信息失败: ${error}`);
    }
  }

  // 辅助方法：文件转 base64
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // 移除 data:image/...;base64, 前缀
        const base64Content = base64.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = error => reject(error);
    });
  }

  // 辅助方法：获取图片信息
  private async getImageInfo(
    file: File
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      // 设置超时，避免永远等待
      const timeout = setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        // 超时后返回默认值而不是 reject，避免影响上传流程
        resolve({ width: 0, height: 0 });
      }, 5000); // 5秒超时

      img.onload = () => {
        clearTimeout(timeout);
        const dimensions = {
          width: img.naturalWidth || img.width || 0,
          height: img.naturalHeight || img.height || 0,
        };
        URL.revokeObjectURL(objectUrl);
        resolve(dimensions);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(objectUrl);
        // 错误时返回默认值，避免影响上传流程
        resolve({ width: 0, height: 0 });
      };

      img.src = objectUrl;
    });
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
