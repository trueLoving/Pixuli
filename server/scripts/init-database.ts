/**
 * 数据库初始化脚本
 * 初始化数据库并添加测试数据
 * 使用方法: pnpm init:database
 */

import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// 加载 .env 文件
dotenv.config({ path: join(__dirname, '../.env') });

// 创建 PrismaClient 实例（使用适配器）
function createPrismaClient(): PrismaClient {
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

  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

async function initDatabase() {
  console.log('🔍 开始初始化数据库...\n');

  // 检查环境变量
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ 错误: DATABASE_URL 环境变量未设置');
    console.log('\n请在 .env 文件中设置:');
    console.log('DATABASE_URL="mysql://用户名:密码@localhost:3306/数据库名"');
    process.exit(1);
  }

  // 隐藏密码显示连接信息
  const safeUrl = databaseUrl.replace(/:[^:@]+@/, ':****@');
  console.log(`📝 数据库连接字符串: ${safeUrl}\n`);

  try {
    // 1. 测试数据库连接
    console.log('1️⃣  测试数据库连接...');
    await prisma.$connect();
    console.log('   ✅ 连接成功\n');

    // 2. 检查表是否存在
    console.log('2️⃣  检查数据库表...');
    // 直接尝试访问 images 表，如果不存在会抛出错误
    let imageTableExists = false;
    try {
      await prisma.image.count();
      imageTableExists = true;
    } catch (error: any) {
      // 表不存在或其他错误
      if (
        error?.message?.includes('Table') ||
        error?.message?.includes('does not exist') ||
        error?.code === 'P2021'
      ) {
        imageTableExists = false;
      } else {
        // 其他错误，重新抛出
        throw error;
      }
    }

    if (!imageTableExists) {
      console.log('   ⚠️  Image 表不存在');
      console.log('   💡 请先运行迁移: pnpm prisma:migrate\n');
      process.exit(1);
    }

    console.log('   ✅ Image 表已存在\n');

    // 3. 清空现有数据（可选）
    console.log('3️⃣  清理现有数据...');
    const existingCount = await prisma.image.count();
    if (existingCount > 0) {
      console.log(`   📊 发现 ${existingCount} 条现有记录`);
      console.log('   🗑️  删除现有数据...');
      await prisma.image.deleteMany();
      console.log('   ✅ 数据已清理\n');
    } else {
      console.log('   ℹ️  数据库为空，无需清理\n');
    }

    // 4. 创建测试数据
    console.log('4️⃣  创建测试数据...');

    const testImages = [
      {
        id: uuidv4(),
        filename: 'test-image-1.jpg',
        originalName: '风景照片.jpg',
        mimeType: 'image/jpeg',
        title: '美丽的风景',
        metadata: {
          size: 2048000,
          width: 1920,
          height: 1080,
          description: '这是一张美丽的风景照片，拍摄于2024年春天',
          tags: ['风景', '自然', '旅行'],
          camera: 'Canon EOS 5D',
          location: '北京',
          date: '2024-01-15',
        },
        path: 'test-image-1.jpg',
        url: '/api/images/test-image-1.jpg/file',
      },
      {
        id: uuidv4(),
        filename: 'test-image-2.png',
        originalName: '城市夜景.png',
        mimeType: 'image/png',
        title: '城市夜景',
        metadata: {
          size: 1536000,
          width: 2560,
          height: 1440,
          description: '繁华都市的夜景，灯火通明',
          tags: ['城市', '夜景', '建筑'],
          camera: 'Sony A7III',
          location: '上海',
          date: '2024-02-20',
        },
        path: 'test-image-2.png',
        url: '/api/images/test-image-2.png/file',
      },
      {
        id: uuidv4(),
        filename: 'test-image-3.jpg',
        originalName: '人物肖像.jpg',
        mimeType: 'image/jpeg',
        title: '人物肖像',
        metadata: {
          size: 1024000,
          width: 1200,
          height: 1600,
          description: '专业人像摄影作品',
          tags: ['人物', '肖像', '摄影'],
          photographer: 'John Doe',
          date: '2024-03-10',
        },
        path: 'test-image-3.jpg',
        url: '/api/images/test-image-3.jpg/file',
      },
      {
        id: uuidv4(),
        filename: 'test-image-4.jpg',
        originalName: '美食照片.jpg',
        mimeType: 'image/jpeg',
        title: '精致美食',
        metadata: {
          size: 896000,
          width: 1600,
          height: 1200,
          description: '精心制作的美食摄影',
          tags: ['美食', '摄影', '生活'],
          restaurant: '米其林餐厅',
          date: '2024-04-05',
        },
        path: 'test-image-4.jpg',
        url: '/api/images/test-image-4.jpg/file',
      },
      {
        id: uuidv4(),
        filename: 'test-image-5.jpg',
        originalName: '动物照片.jpg',
        mimeType: 'image/jpeg',
        title: '可爱的小猫',
        metadata: {
          size: 512000,
          width: 800,
          height: 600,
          description: '一只可爱的小猫咪',
          tags: ['动物', '宠物', '可爱'],
          species: '猫',
          date: '2024-05-12',
        },
        path: 'test-image-5.jpg',
        url: '/api/images/test-image-5.jpg/file',
      },
    ];

    // 批量创建测试数据
    for (const image of testImages) {
      await prisma.image.create({
        data: image,
      });
      console.log(`   ✅ 创建测试图片: ${image.title}`);
    }

    // 5. 验证数据
    console.log('\n5️⃣  验证数据...');
    const totalCount = await prisma.image.count();
    console.log(`   📊 数据库中共有 ${totalCount} 条记录`);

    // 统计包含特定标签的图片（使用内存过滤，因为 MySQL JSON 查询较复杂）
    const allImages = await prisma.image.findMany({
      select: { id: true, metadata: true },
    });
    const landscapeCount = allImages.filter(img => {
      const metadata = (img.metadata as Record<string, any>) || {};
      const tags = metadata.tags || [];
      return Array.isArray(tags) && tags.includes('风景');
    }).length;
    console.log(`   🏷️  包含"风景"标签的图片: ${landscapeCount} 张`);

    console.log('\n✅ 数据库初始化完成！');
    console.log('\n📋 测试数据摘要:');
    console.log(`   - 总图片数: ${totalCount}`);
    console.log(`   - 测试图片包含多种标签和元数据`);
    console.log('\n💡 提示: 可以使用以下命令查看数据:');
    console.log('   pnpm prisma:studio');
  } catch (error: any) {
    console.error('\n❌ 数据库初始化失败！\n');
    console.error('错误信息:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 可能的原因:');
      console.error('   1. MySQL 服务未启动');
      console.error('   2. 端口号不正确（当前配置: 3306）');
      console.error('   3. 主机地址不正确');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 可能的原因:');
      console.error('   1. 用户名或密码错误');
      console.error('   2. 用户没有访问该数据库的权限');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 可能的原因:');
      console.error('   1. 数据库不存在');
      console.error('   2. 请先创建数据库: CREATE DATABASE pixuli;');
    } else if (error.code === 'P2002') {
      console.error('\n💡 可能的原因:');
      console.error('   1. 数据已存在（唯一约束冲突）');
      console.error('   2. 可以运行脚本清理后重试');
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 运行初始化
initDatabase().catch(error => {
  console.error('未处理的错误:', error);
  process.exit(1);
});
