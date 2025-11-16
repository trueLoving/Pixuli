import {
  ImageEditData,
  ImageItem,
  ImageUploadData,
  UpyunConfig,
} from '@packages/ui/src';

export class UpyunStorageService {
  private config: UpyunConfig;

  constructor(config: UpyunConfig) {
    this.config = config;
  }

  // 获取图片列表
  async getImageList(): Promise<ImageItem[]> {
    try {
      // 通过 IPC 调用主进程的又拍云服务
      const response = await window.upyunAPI.upyunGetList({
        config: this.config,
      });

      if (!response.success) {
        throw new Error(response.error || '获取图片列表失败');
      }

      // 获取元数据映射（从主进程返回）
      const metadataMap = response.metadataMap || {};

      // 转换为 ImageItem 格式，合并元数据
      const images: ImageItem[] = (response.files || [])
        .filter((file: any) => {
          // 过滤掉元数据文件本身（元数据文件格式：{filename}.metadata.{ext}.json）
          return !(
            file.name.includes('.metadata.') && file.name.endsWith('.json')
          );
        })
        .map((file: any) => {
          // 从 metadataMap 中获取对应的 metadata
          // 元数据文件名格式：{filename}.metadata.{ext}.json
          const metadataKey = file.name.replace(/\.metadata\.[^.]+\.json$/, '');
          const parsedMetadata =
            metadataMap[metadataKey] || metadataMap[file.name];
          const metadata = parsedMetadata
            ? {
                size: parsedMetadata.size || file.size || 0, // 优先从元数据读取，备选文件大小
                width: parsedMetadata.width || 0,
                height: parsedMetadata.height || 0,
                tags: Array.isArray(parsedMetadata.tags)
                  ? parsedMetadata.tags
                  : [],
                description: parsedMetadata.description || '',
                updatedAt:
                  parsedMetadata.updatedAt ||
                  new Date(file.time * 1000).toISOString(),
                createdAt:
                  parsedMetadata.createdAt ||
                  new Date(file.time * 1000).toISOString(),
              }
            : {
                size: file.size || 0, // 从文件信息获取
                width: 0,
                height: 0,
                tags: [] as string[],
                description: '',
                updatedAt: new Date(file.time * 1000).toISOString(),
                createdAt: new Date(file.time * 1000).toISOString(),
              };

          return {
            id: parsedMetadata?.id || `${file.time}-${file.name}`,
            name: file.name,
            url: file.url,
            githubUrl: file.url, // 又拍云没有 GitHub URL，使用访问 URL
            size: metadata.size,
            width: metadata.width,
            height: metadata.height,
            type: this.getMimeType(file.name),
            tags: metadata.tags,
            description: metadata.description,
            createdAt: metadata.createdAt,
            updatedAt: metadata.updatedAt,
          };
        });

      return images;
    } catch (error) {
      console.error('Failed to get image list:', error);
      throw new Error(`获取图片列表失败: ${error}`);
    }
  }

  // 上传图片到又拍云
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
      // 通过 IPC 调用主进程的又拍云上传功能
      const response = await window.upyunAPI.upyunUpload({
        config: this.config,
        fileName,
        content: base64Content,
        description,
        tags,
      });

      if (!response.success) {
        throw new Error(response.error || '上传失败');
      }

      // ========== 构建图片元数据对象 ==========
      // 包含所有元数据信息：尺寸、标签、描述等
      const imageItem: ImageItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: fileName,
        url: response.url || '',
        githubUrl: response.url || '', // 又拍云没有 GitHub URL，使用访问 URL
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
      // 将包含尺寸信息的元数据上传到又拍云
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
      // 通过 IPC 调用主进程的又拍云删除功能
      // 主进程会同时删除图片文件和元数据文件
      const response = await window.upyunAPI.upyunDelete({
        config: this.config,
        fileName,
      });

      if (!response.success) {
        throw new Error(response.error || '删除失败');
      }
    } catch (error) {
      console.error('Delete image failed:', error);
      throw new Error(`删除图片失败: ${error}`);
    }
  }

  // 更新图片信息（标签、描述等）
  async updateImage(editData: ImageEditData): Promise<void> {
    try {
      // 获取当前图片信息
      const images = await this.getImageList();
      const currentImage = images.find(img => img.id === editData.id);

      if (!currentImage) {
        throw new Error('图片不存在');
      }

      // 构建更新的元数据
      const updatedMetadata: ImageItem = {
        ...currentImage,
        name: editData.name || currentImage.name,
        description: editData.description ?? currentImage.description,
        tags: editData.tags ?? currentImage.tags,
        updatedAt: new Date().toISOString(),
      };

      // 更新元数据文件
      await this.updateImageInfo(
        editData.id,
        editData.name || currentImage.name,
        updatedMetadata,
        currentImage.name
      );
    } catch (error) {
      console.error('Update image failed:', error);
      throw new Error(`更新图片失败: ${error}`);
    }
  }

  // 批量上传图片
  async uploadMultipleImages(
    uploadDataList: ImageUploadData[]
  ): Promise<ImageItem[]> {
    const results: ImageItem[] = [];

    for (const uploadData of uploadDataList) {
      try {
        const result = await this.uploadImage(uploadData);
        results.push(result);
      } catch (error) {
        console.error('Batch upload failed for:', uploadData.file.name, error);
        // 继续处理其他文件
      }
    }

    return results;
  }

  // 测试连接
  async testConnection(): Promise<boolean> {
    try {
      const response = await window.upyunAPI.upyunTest(this.config);
      return response.success;
    } catch (error) {
      console.error('Test connection failed:', error);
      return false;
    }
  }

  // 更新图片元数据（上传或更新元数据文件）
  async updateImageInfo(
    imageId: string,
    fileName: string,
    metadata: ImageItem,
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

      // 通过 IPC 调用主进程的又拍云元数据更新功能
      await window.upyunAPI.upyunUpdateMetadata({
        config: this.config,
        fileName,
        metadata: metadataToUpdate,
        oldFileName,
      });
    } catch (error) {
      console.error('Update image info failed:', error);
      throw new Error(`更新图片信息失败: ${error}`);
    }
  }

  // 将文件转换为 base64
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // 移除 data:image/...;base64, 前缀
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 获取图片信息
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

  // 根据文件名获取 MIME 类型
  private getMimeType(fileName: string): string {
    const ext = fileName.toLowerCase().split('.').pop();
    const mimeTypes: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      bmp: 'image/bmp',
      svg: 'image/svg+xml',
    };
    return mimeTypes[ext || ''] || 'image/jpeg';
  }
}
