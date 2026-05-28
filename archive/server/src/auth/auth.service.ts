import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  /**
   * 验证 API Key
   * 支持两种方式：
   * 1. 环境变量中的 API_KEY（简单模式）
   * 2. 数据库中的 API Key（完整模式）
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    // 方式1: 检查环境变量中的 API_KEY（简单模式）
    const envApiKey = process.env.API_KEY;
    if (envApiKey && apiKey === envApiKey) {
      return true;
    }

    // 方式2: 检查数据库中的 API Key（完整模式）
    if (process.env.ENABLE_DB_API_KEYS === 'true') {
      const keyHash = this.hashApiKey(apiKey);
      const apiKeyRecord = await this.prisma.apiKey.findFirst({
        where: {
          keyHash,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });

      if (apiKeyRecord) {
        // 更新最后使用时间
        await this.prisma.apiKey.update({
          where: { id: apiKeyRecord.id },
          data: { lastUsedAt: new Date() },
        });
        return true;
      }
    }

    return false;
  }

  /**
   * 创建新的 API Key
   */
  async createApiKey(
    name: string,
    expiresAt?: Date,
  ): Promise<{ id: string; key: string; name: string }> {
    // 生成随机 API Key
    const key = this.generateApiKey();
    const keyHash = this.hashApiKey(key);

    const apiKeyRecord = await this.prisma.apiKey.create({
      data: {
        name,
        key: keyHash, // 存储哈希值用于索引（不存储原始 key）
        keyHash, // 存储哈希值用于验证
        expiresAt,
      },
    });

    // 返回原始 key（只返回一次，之后无法获取）
    return {
      id: apiKeyRecord.id,
      key,
      name: apiKeyRecord.name,
    };
  }

  /**
   * 列出所有 API Key（不返回实际 key 值）
   */
  async listApiKeys() {
    return this.prisma.apiKey.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 禁用 API Key
   */
  async deactivateApiKey(id: string): Promise<void> {
    await this.prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * 删除 API Key
   */
  async deleteApiKey(id: string): Promise<void> {
    await this.prisma.apiKey.delete({
      where: { id },
    });
  }

  /**
   * 生成 API Key
   */
  private generateApiKey(): string {
    return `pk_${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * 哈希 API Key（用于存储和验证）
   */
  private hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }
}
