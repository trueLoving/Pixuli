import {
  ImageItem,
  ImageUploadData,
  ImageEditData,
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
      const response = await window.electronAPI.upyunGetList({
        config: this.config,
      });

      console.log(response);

      if (!response.success) {
        throw new Error(response.error || '获取图片列表失败');
      }

      // 转换为 ImageItem 格式
      const images: ImageItem[] = (response.files || []).map((file: any) => ({
        id: `${file.time}-${file.name}`,
        name: file.name,
        url: file.url,
        githubUrl: file.url, // 又拍云没有 GitHub URL，使用访问 URL
        size: file.size,
        width: 0, // 又拍云 API 不提供图片尺寸信息
        height: 0,
        type: this.getMimeType(file.name),
        tags: [],
        description: '',
        createdAt: new Date(file.time * 1000).toISOString(),
        updatedAt: new Date(file.time * 1000).toISOString(),
      }));

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

      // 将文件转换为 base64
      const base64Content = await this.fileToBase64(file);

      // 通过 IPC 调用主进程的又拍云上传功能
      const response = await window.electronAPI.upyunUpload({
        config: this.config,
        fileName,
        content: base64Content,
        description,
        tags,
      });

      if (!response.success) {
        throw new Error(response.error || '上传失败');
      }

      // 获取图片信息
      const imageInfo = await this.getImageInfo(file);

      const imageItem: ImageItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: fileName,
        url: response.url || '',
        githubUrl: response.url || '', // 又拍云没有 GitHub URL，使用访问 URL
        size: file.size,
        width: imageInfo.width,
        height: imageInfo.height,
        type: file.type,
        tags: tags || [],
        description: description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

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
      const response = await window.electronAPI.upyunDelete({
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

  // 更新图片信息（又拍云不支持元数据更新，这里只更新本地状态）
  async updateImage(editData: ImageEditData): Promise<void> {
    try {
      // 又拍云不支持元数据更新，这里只返回成功
      // 实际应用中可能需要通过其他方式存储元数据
      console.log('Upyun does not support metadata updates:', editData);
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
      const response = await window.electronAPI.upyunTest(this.config);
      return response.success;
    } catch (error) {
      console.error('Test connection failed:', error);
      return false;
    }
  }

  async updateImageInfo() {}

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
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
      img.src = URL.createObjectURL(file);
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
