import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private databaseName: string;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL 环境变量未设置');
    }

    // 解析 DATABASE_URL: mysql://user:password@host:port/database
    const url = new URL(databaseUrl);
    const databaseName = url.pathname.slice(1); // 移除前导斜杠

    const adapter = new PrismaMariaDb({
      host: url.hostname,
      port: url.port ? parseInt(url.port, 10) : 3306,
      user: url.username,
      password: url.password,
      database: databaseName,
    });

    super({ adapter });
    // 在 super() 调用之后才能访问 this
    this.databaseName = databaseName;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ 数据库连接成功');

      // 测试数据库连接
      await this.testConnection();
    } catch (error) {
      this.logger.error('❌ 数据库连接失败', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('数据库连接已关闭');
  }

  /**
   * 测试数据库连接
   */
  async testConnection(): Promise<void> {
    try {
      // 执行一个简单的查询来测试连接
      await this.$queryRaw`SELECT 1`;
      this.logger.log('✅ 数据库连接测试通过');

      // 直接尝试获取 Image 表的记录数
      // 如果表不存在，会抛出错误，我们捕获它并提示运行迁移
      try {
        const count = await this.image.count();
        this.logger.log(`📊 Image 表已存在，当前有 ${count} 条记录`);
      } catch (tableError: any) {
        // 如果表不存在或其他错误，记录警告
        if (
          tableError?.message?.includes('Table') ||
          tableError?.message?.includes('does not exist') ||
          tableError?.code === 'P2021'
        ) {
          this.logger.warn(
            '⚠️  Image 表不存在，请运行迁移: pnpm prisma:migrate',
          );
        } else {
          // 其他错误也记录，但不抛出
          this.logger.warn(
            `⚠️  无法访问 Image 表: ${tableError?.message || '未知错误'}`,
          );
        }
      }
    } catch (error) {
      this.logger.error('❌ 数据库连接测试失败', error);
      throw error;
    }
  }
}
