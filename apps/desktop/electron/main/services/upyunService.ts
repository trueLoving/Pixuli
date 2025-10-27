import { ipcMain } from 'electron';
// @ts-ignore
import * as upyun from 'upyun';

interface UpyunConfig {
  operator: string;
  password: string;
  bucket: string;
  domain: string;
  path: string;
}

interface UpyunUploadParams {
  config: UpyunConfig;
  fileName: string;
  content: string; // base64 content
  description?: string;
  tags?: string[];
}

interface UpyunDeleteParams {
  config: UpyunConfig;
  fileName: string;
}

interface UpyunListParams {
  config: UpyunConfig;
}

// 元数据
interface UpyunUpdateMetadataParams {}

class UpyunService {
  private createService(config: UpyunConfig) {
    return new upyun.Service(config.bucket, config.operator, config.password);
  }

  private createClient(config: UpyunConfig) {
    const service = this.createService(config);
    return new upyun.Client(service);
  }

  // 上传文件
  async uploadFile(params: UpyunUploadParams) {
    try {
      const { config, fileName, content, description, tags } = params;
      const client = this.createClient(config);

      // 生成文件路径
      const filePath = `${config.path}/${fileName}`;

      // 将 base64 转换为 Buffer
      const buffer = Buffer.from(content, 'base64');

      // 上传文件
      const result = await client.putFile(filePath, buffer);

      if (!result) {
        throw new Error('上传失败');
      }

      // 构建访问 URL
      const url = `${config.domain}/${filePath}`;

      return {
        success: true,
        url,
        path: filePath,
        result,
      };
    } catch (error) {
      console.error('Upyun upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '上传失败',
      };
    }
  }

  // 删除文件
  async deleteFile(params: UpyunDeleteParams) {
    try {
      const { config, fileName } = params;
      const client = this.createClient(config);

      const filePath = `${config.path}/${fileName}`;
      const result = await client.deleteFile(filePath);

      return {
        success: result,
        error: result ? null : '删除失败',
      };
    } catch (error) {
      console.error('Upyun delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除失败',
      };
    }
  }

  // 获取文件列表
  async getFileList(params: UpyunListParams) {
    try {
      const { config } = params;
      const client = this.createClient(config);

      // 获取目录列表
      const result = await client.listDir(config.path, {
        limit: 10000,
        order: 'desc',
      });

      if (!result) {
        return {
          success: true,
          files: [],
        };
      }

      // 过滤出图片文件
      const imageFiles = result.files.filter((file: any) => {
        const name = file.name.toLowerCase();
        return (
          name.endsWith('.jpg') ||
          name.endsWith('.jpeg') ||
          name.endsWith('.png') ||
          name.endsWith('.gif') ||
          name.endsWith('.webp') ||
          name.endsWith('.bmp') ||
          name.endsWith('.svg')
        );
      });

      console.log(imageFiles);

      return {
        success: true,
        files: imageFiles.map((file: any) => ({
          name: file.name,
          size: file.size,
          time: file.time,
          url: `http://${config.domain}/${config.path}/${file.name}`,
        })),
      };
    } catch (error) {
      console.error('Upyun list error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取文件列表失败',
      };
    }
  }

  async updateMetadata(params: UpyunUpdateMetadataParams) {}
}

const upyunService = new UpyunService();

// 注册 IPC 处理程序
export function registerUpyunHandlers() {
  // 上传文件
  ipcMain.handle('upyun:upload', async (event, params: UpyunUploadParams) => {
    return await upyunService.uploadFile(params);
  });

  // 删除文件
  ipcMain.handle('upyun:delete', async (event, params: UpyunDeleteParams) => {
    return await upyunService.deleteFile(params);
  });

  // 获取文件列表
  ipcMain.handle('upyun:list', async (event, params: UpyunListParams) => {
    return await upyunService.getFileList(params);
  });
}
