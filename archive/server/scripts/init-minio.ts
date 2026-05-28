/**
 * MinIO 初始化脚本
 * 创建存储桶并配置访问策略
 * 使用方法: pnpm ts-node scripts/init-minio.ts
 */

import {
  S3Client,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import { join } from 'path';

// 加载 .env 文件
dotenv.config({ path: join(__dirname, '../.env') });

async function initMinIO() {
  console.log('🔍 开始初始化 MinIO...\n');

  const endpoint = process.env.MINIO_ENDPOINT || 'localhost:9000';
  const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
  const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
  const bucket = process.env.MINIO_BUCKET || 'pixuli-images';
  const useSSL = process.env.MINIO_USE_SSL === 'true';

  const protocol = useSSL ? 'https://' : 'http://';
  const s3Endpoint = `${protocol}${endpoint}`;

  console.log(`📝 MinIO 配置:`);
  console.log(`   端点: ${s3Endpoint}`);
  console.log(`   存储桶: ${bucket}\n`);

  const s3Client = new S3Client({
    endpoint: s3Endpoint,
    region: process.env.MINIO_REGION || 'us-east-1',
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    forcePathStyle: true,
  });

  try {
    // 1. 创建存储桶
    console.log('1️⃣  创建存储桶...');
    try {
      await s3Client.send(
        new CreateBucketCommand({
          Bucket: bucket,
        }),
      );
      console.log(`   ✅ 存储桶 "${bucket}" 创建成功\n`);
    } catch (error: any) {
      if (error.name === 'BucketAlreadyOwnedByYou') {
        console.log(`   ℹ️  存储桶 "${bucket}" 已存在\n`);
      } else {
        throw error;
      }
    }

    // 2. 设置存储桶策略（允许公共读取）
    console.log('2️⃣  配置存储桶策略...');
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    };

    try {
      await s3Client.send(
        new PutBucketPolicyCommand({
          Bucket: bucket,
          Policy: JSON.stringify(policy),
        }),
      );
      console.log('   ✅ 存储桶策略配置成功\n');
    } catch (error: any) {
      console.log(`   ⚠️  策略配置失败: ${error.message}\n`);
      console.log('   💡 提示: 可以在 MinIO Web UI 中手动配置策略\n');
    }

    console.log('✅ MinIO 初始化完成！');
    console.log(`\n📦 存储桶名称: ${bucket}`);
    console.log(`🌐 Web UI: ${protocol}${endpoint.replace(':9000', ':9001')}`);
    console.log(`   (默认用户名: ${accessKey}, 密码: ${secretKey})`);
  } catch (error: any) {
    console.error('\n❌ MinIO 初始化失败！\n');
    console.error('错误信息:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 可能的原因:');
      console.error('   1. MinIO 服务未启动');
      console.error('   2. 端点地址不正确');
      console.error('   3. 端口被占用');
    } else if (error.name === 'InvalidAccessKeyId') {
      console.error('\n💡 可能的原因:');
      console.error('   1. 访问密钥不正确');
      console.error('   2. 秘密密钥不正确');
    }

    process.exit(1);
  }
}

// 运行初始化
initMinIO().catch(error => {
  console.error('未处理的错误:', error);
  process.exit(1);
});
