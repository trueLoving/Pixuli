import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageAdapter } from '../interfaces/storage-adapter.interface';

@Injectable()
export class MinIOStorageAdapter implements StorageAdapter {
  private readonly logger = new Logger(MinIOStorageAdapter.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;
  private readonly useSSL: boolean;

  constructor() {
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost:9000';
    const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
    const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
    this.bucket = process.env.MINIO_BUCKET || 'pixuli-images';
    this.useSSL = process.env.MINIO_USE_SSL === 'true';
    this.endpoint = endpoint;

    // 构建 S3 客户端配置
    const protocol = this.useSSL ? 'https://' : 'http://';
    const s3Endpoint = `${protocol}${endpoint}`;

    this.s3Client = new S3Client({
      endpoint: s3Endpoint,
      region: process.env.MINIO_REGION || 'us-east-1',
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true, // MinIO 需要路径样式
    });

    this.logger.log(
      `MinIO 存储适配器已初始化: ${s3Endpoint}, Bucket: ${this.bucket}`,
    );
  }

  /**
   * 上传文件到 MinIO
   */
  async upload(file: Buffer, key: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
      });

      await this.s3Client.send(command);
      return key;
    } catch (error) {
      this.logger.error(`上传文件失败: ${key}`, error);
      throw new Error(`上传文件到 MinIO 失败: ${error.message}`);
    }
  }

  /**
   * 从 MinIO 下载文件
   */
  async download(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const chunks: Uint8Array[] = [];

      if (response.Body) {
        for await (const chunk of response.Body as any) {
          chunks.push(chunk);
        }
      }

      return Buffer.concat(chunks);
    } catch (error) {
      this.logger.error(`下载文件失败: ${key}`, error);
      throw new Error(`从 MinIO 下载文件失败: ${error.message}`);
    }
  }

  /**
   * 从 MinIO 删除文件
   */
  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error(`删除文件失败: ${key}`, error);
      throw new Error(`从 MinIO 删除文件失败: ${error.message}`);
    }
  }

  /**
   * 检查文件是否存在
   */
  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      throw error;
    }
  }

  /**
   * 获取文件访问 URL
   */
  async getUrl(key: string): Promise<string> {
    // MinIO 直接访问 URL
    const protocol = this.useSSL ? 'https://' : 'http://';
    return `${protocol}${this.endpoint}/${this.bucket}/${key}`;
  }

  /**
   * 获取预签名 URL（用于直接访问，减轻服务器压力）
   */
  async getPresignedUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logger.error(`生成预签名 URL 失败: ${key}`, error);
      throw new Error(`生成预签名 URL 失败: ${error.message}`);
    }
  }
}
