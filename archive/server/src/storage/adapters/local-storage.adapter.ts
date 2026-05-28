import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { StorageAdapter } from '../interfaces/storage-adapter.interface';

@Injectable()
export class LocalStorageAdapter implements StorageAdapter {
  private readonly baseDir: string;

  constructor() {
    // 从环境变量获取存储目录，默认为 uploads/images
    this.baseDir = join(
      process.cwd(),
      process.env.STORAGE_LOCAL_DIR || 'uploads/images',
    );

    // 确保目录存在
    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true });
    }
  }

  /**
   * 上传文件到本地文件系统
   */
  async upload(file: Buffer, key: string): Promise<string> {
    const filePath = join(this.baseDir, key);
    const fileDir = dirname(filePath);

    // 确保目录存在
    if (!existsSync(fileDir)) {
      mkdirSync(fileDir, { recursive: true });
    }

    // 写入文件
    await writeFile(filePath, file);

    // 返回相对路径（用于数据库存储）
    return key;
  }

  /**
   * 从本地文件系统下载文件
   */
  async download(key: string): Promise<Buffer> {
    const filePath = join(this.baseDir, key);

    if (!existsSync(filePath)) {
      throw new Error(`文件不存在: ${key}`);
    }

    return readFile(filePath);
  }

  /**
   * 从本地文件系统删除文件
   */
  async delete(key: string): Promise<void> {
    const filePath = join(this.baseDir, key);

    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }

  /**
   * 检查文件是否存在
   */
  async exists(key: string): Promise<boolean> {
    const filePath = join(this.baseDir, key);
    return existsSync(filePath);
  }

  /**
   * 获取文件访问 URL
   */
  async getUrl(key: string): Promise<string> {
    // 本地存储返回 API 路径
    return `/api/images/${key}/file`;
  }

  /**
   * 获取文件完整路径（用于直接文件访问）
   */
  getFilePath(key: string): string {
    return join(this.baseDir, key);
  }
}
