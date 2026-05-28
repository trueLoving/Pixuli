import { Injectable, Logger } from '@nestjs/common';
import { StorageAdapter } from './interfaces/storage-adapter.interface';
import { LocalStorageAdapter } from './adapters/local-storage.adapter';
import { MinIOStorageAdapter } from './adapters/minio-storage.adapter';

/**
 * 存储服务
 * 支持多个存储适配器同时工作
 * 根据环境变量配置选择使用的存储后端
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly adapters: StorageAdapter[] = [];
  private readonly primaryAdapter: StorageAdapter;

  constructor(
    private readonly localStorageAdapter: LocalStorageAdapter,
    private readonly minIOStorageAdapter: MinIOStorageAdapter,
  ) {
    // 解析存储配置（支持多个，用逗号分隔）
    const storageTypes = (process.env.STORAGE_TYPES || 'local')
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // 初始化适配器
    for (const type of storageTypes) {
      switch (type.toLowerCase()) {
        case 'local':
          this.adapters.push(this.localStorageAdapter);
          this.logger.log('✅ 已启用本地存储适配器');
          break;
        case 'minio':
          try {
            this.adapters.push(this.minIOStorageAdapter);
            this.logger.log('✅ 已启用 MinIO 存储适配器');
          } catch (error) {
            this.logger.error(
              `❌ MinIO 存储适配器初始化失败: ${error.message}`,
            );
            this.logger.warn('⚠️  将跳过 MinIO 存储适配器');
          }
          break;
        default:
          this.logger.warn(`⚠️  未知的存储类型: ${type}`);
      }
    }

    if (this.adapters.length === 0) {
      this.logger.warn('⚠️  未配置任何存储适配器，使用默认本地存储');
      this.adapters.push(this.localStorageAdapter);
    }

    // 主适配器（第一个）
    this.primaryAdapter = this.adapters[0];
    const primaryType = storageTypes[0] || 'local';
    this.logger.log(`📦 主存储适配器: ${primaryType}`);
    this.logger.log(`📦 共启用 ${this.adapters.length} 个存储适配器`);
  }

  /**
   * 上传文件（写入所有启用的存储）
   */
  async upload(file: Buffer, key: string): Promise<string> {
    const results = await Promise.allSettled(
      this.adapters.map(adapter => adapter.upload(file, key)),
    );

    // 检查是否有成功的结果
    const successResults = results.filter(r => r.status === 'fulfilled');
    if (successResults.length === 0) {
      const errors = results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason);
      throw new Error(`所有存储适配器上传失败: ${errors.join(', ')}`);
    }

    // 记录失败的适配器
    const failedResults = results.filter(r => r.status === 'rejected');
    if (failedResults.length > 0) {
      failedResults.forEach(r => {
        this.logger.warn(
          `存储适配器上传失败: ${(r as PromiseRejectedResult).reason}`,
        );
      });
    }

    // 返回主适配器的结果
    return (successResults[0] as PromiseFulfilledResult<string>).value;
  }

  /**
   * 下载文件（从主适配器读取）
   */
  async download(key: string): Promise<Buffer> {
    return this.primaryAdapter.download(key);
  }

  /**
   * 删除文件（从所有启用的存储删除）
   */
  async delete(key: string): Promise<void> {
    await Promise.allSettled(this.adapters.map(adapter => adapter.delete(key)));
  }

  /**
   * 检查文件是否存在（检查主适配器）
   */
  async exists(key: string): Promise<boolean> {
    return this.primaryAdapter.exists(key);
  }

  /**
   * 获取文件访问 URL（从主适配器获取）
   */
  async getUrl(key: string): Promise<string> {
    return this.primaryAdapter.getUrl(key);
  }

  /**
   * 获取预签名 URL（如果主适配器支持）
   */
  async getPresignedUrl(
    key: string,
    expiresIn?: number,
  ): Promise<string | null> {
    if (this.primaryAdapter.getPresignedUrl) {
      return this.primaryAdapter.getPresignedUrl(key, expiresIn);
    }
    return null;
  }

  /**
   * 获取主适配器
   */
  getPrimaryAdapter(): StorageAdapter {
    return this.primaryAdapter;
  }

  /**
   * 获取所有适配器
   */
  getAllAdapters(): StorageAdapter[] {
    return this.adapters;
  }

  /**
   * 获取本地存储适配器（用于直接文件访问）
   */
  getLocalStorageAdapter(): LocalStorageAdapter | null {
    const localAdapter = this.adapters.find(
      adapter => adapter instanceof LocalStorageAdapter,
    );
    return localAdapter ? (localAdapter as LocalStorageAdapter) : null;
  }
}
