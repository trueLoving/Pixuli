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
interface UpyunUpdateMetadataParams {
  config: UpyunConfig;
  fileName: string;
  metadata: any;
  oldFileName?: string;
}

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
      const { config, fileName, content } = params;
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

      // 删除图片文件
      const result = await client.deleteFile(filePath);

      // 同时删除元数据文件（如果存在）
      // 元数据文件名格式：{filename}.metadata.{ext}.json
      const getMetadataFileName = (fileName: string): string => {
        const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
        const extension = fileName.substring(fileName.lastIndexOf('.'));
        return `${nameWithoutExt}.metadata${extension}.json`;
      };

      const metadataFileName = getMetadataFileName(fileName);
      const metadataPath = `${config.path}/${metadataFileName}`;

      try {
        await client.deleteFile(metadataPath);
      } catch (error) {
        // 元数据文件可能不存在，忽略错误
        console.warn(`Metadata file ${metadataFileName} may not exist:`, error);
      }

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
          metadataMap: {},
        };
      }

      // 过滤出图片文件和元数据文件
      const imageFiles = result.files.filter((file: any) => {
        const name = file.name.toLowerCase();
        return (
          name.endsWith('.jpg') ||
          name.endsWith('.jpeg') ||
          name.endsWith('.png') ||
          name.endsWith('.gif') ||
          name.endsWith('.webp') ||
          name.endsWith('.bmp') ||
          name.endsWith('.svg') ||
          (name.includes('.metadata.') && name.endsWith('.json'))
        );
      });

      // 读取所有元数据文件
      const metadataMap: { [key: string]: any } = {};
      const metadataFiles = imageFiles.filter(
        (file: any) =>
          file.name.includes('.metadata.') && file.name.endsWith('.json')
      );

      for (const metadataFile of metadataFiles) {
        try {
          const metadataPath = `${config.path}/${metadataFile.name}`;
          const metadataBuffer = await client.getFile(metadataPath);
          if (metadataBuffer) {
            const metadataContent = metadataBuffer.toString('utf-8');
            const metadata = JSON.parse(metadataContent);
            // 元数据文件名格式：{filename}.metadata.{ext}.json
            // 提取原始文件名作为 key
            const originalFileName = metadataFile.name.replace(
              /\.metadata\.[^.]+\.json$/,
              ''
            );
            metadataMap[originalFileName] = metadata;
            // 也使用完整文件名作为 key（兼容）
            metadataMap[metadataFile.name] = metadata;
          }
        } catch (error) {
          console.warn(
            `Failed to read metadata file ${metadataFile.name}:`,
            error
          );
          // 继续处理其他文件
        }
      }

      return {
        success: true,
        files: imageFiles.map((file: any) => ({
          name: file.name,
          size: file.size,
          time: file.time,
          url: `http://${config.domain}/${config.path}/${file.name}`,
        })),
        metadataMap,
      };
    } catch (error) {
      console.error('Upyun list error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取文件列表失败',
        files: [],
        metadataMap: {},
      };
    }
  }

  // 更新元数据
  async updateMetadata(params: UpyunUpdateMetadataParams) {
    try {
      const { config, fileName, metadata, oldFileName } = params;
      const client = this.createClient(config);

      // 创建或更新元数据文件
      // 元数据文件名格式：{filename}.metadata.{ext}.json
      // 例如：photo.jpg -> photo.metadata.jpg.json
      const getMetadataFileName = (fileName: string): string => {
        const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
        const extension = fileName.substring(fileName.lastIndexOf('.'));
        return `${nameWithoutExt}.metadata${extension}.json`;
      };

      const targetFileName = fileName;
      const metadataFileName = getMetadataFileName(targetFileName);
      const metadataPath = `${config.path}/${metadataFileName}`;
      const metadataContent = JSON.stringify(metadata, null, 2);
      const metadataBuffer = Buffer.from(metadataContent, 'utf-8');

      // 如果文件名改变了，需要删除旧的元数据文件
      if (oldFileName && oldFileName !== fileName) {
        const oldMetadataFileName = getMetadataFileName(oldFileName);
        const oldMetadataPath = `${config.path}/${oldMetadataFileName}`;
        try {
          await client.deleteFile(oldMetadataPath);
        } catch (error) {
          // 旧文件可能不存在，忽略错误
          console.warn(
            `Old metadata file ${oldMetadataFileName} may not exist:`,
            error
          );
        }
      }

      // 上传元数据文件
      const result = await client.putFile(metadataPath, metadataBuffer);

      if (!result) {
        throw new Error('上传元数据失败');
      }

      return {
        success: true,
        path: metadataPath,
      };
    } catch (error) {
      console.error('Upyun update metadata error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新元数据失败',
      };
    }
  }
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

  // 更新元数据
  ipcMain.handle(
    'upyun:updateMetadata',
    async (event, params: UpyunUpdateMetadataParams) => {
      return await upyunService.updateMetadata(params);
    }
  );
}
