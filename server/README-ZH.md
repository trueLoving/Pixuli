[English](./README.md) | 中文

# Pixuli Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Required Node.JS >= 22.0.0](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/about/releases)

Pixuli 智能图片管理应用的后端服务，基于 NestJS 和 Prisma 构建，支持多种存储后端。

## ✨ 主要功能

- 📸 **图片管理** - 上传、检索、更新和删除图片及元数据
- 🔐 **API Key 认证** - 灵活的认证系统，支持环境变量和数据库存储的 API Key
- 💾 **多存储后端** - 支持本地文件系统和 MinIO 对象存储
- 📚 **Swagger API 文档** - 交互式 API 文档，支持认证
- 🏷️ **标签系统** - 使用标签组织图片并支持搜索
- 🔍 **元数据管理** - 丰富的元数据支持，包括标题、描述和自定义字段

## 🚀 快速开始

### 环境要求

- **Node.js** >= 22.0.0
- **pnpm** >= 8.0.0 (必需，项目仅支持 pnpm)
- **MySQL** >= 8.0 (或 MariaDB)
- **Docker** (可选，用于 MinIO 部署)

### 安装步骤

1. **安装依赖**：

```bash
pnpm install
```

2. **配置环境变量**：

复制 `.env.example` 为 `.env` 并配置：

```env
# 数据库
DATABASE_URL="mysql://root:password@localhost:3306/pixuli"
PORT=3000

# 存储（选择一个或两个）
STORAGE_TYPES=local
# STORAGE_TYPES=minio
# STORAGE_TYPES=local,minio

# 认证（可选）
API_KEY=your-secret-api-key-here
```

3. **创建数据库**：

```sql
CREATE DATABASE pixuli CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. **运行数据库迁移**：

```bash
pnpm prisma migrate dev
```

5. **启动开发服务器**：

```bash
pnpm dev
```

服务器将在 `http://localhost:3000`（或配置的 PORT）启动。

## 📋 可用命令

```bash
# 开发
pnpm dev              # 启动开发服务器（热重载）
pnpm build            # 构建生产版本
pnpm preview          # 预览生产构建

# 数据库
pnpm init:database    # 初始化数据库
pnpm init:minio       # 初始化 MinIO 存储桶

# Prisma
pnpm prisma:generate  # 生成 Prisma Client
pnpm prisma:migrate   # 运行数据库迁移
pnpm prisma:studio    # 打开 Prisma Studio（数据库 GUI）
```

## 🔌 API 端点

### 图片管理

- `POST /api/images/upload` - 上传单张图片
- `POST /api/images/upload/multiple` - 批量上传图片
- `GET /api/images` - 获取所有图片
- `GET /api/images/:id` - 根据 ID 获取图片元数据
- `GET /api/images/:id/file` - 获取图片文件
- `GET /api/images/:id/presigned-url` - 获取预签名 URL（仅 MinIO）
- `PUT /api/images/:id/metadata` - 更新图片元数据
- `DELETE /api/images/:id` - 删除图片
- `GET /api/images/tags/:tagName` - 根据标签获取图片

### 认证

- `POST /api/auth/api-keys` - 创建 API Key
- `GET /api/auth/api-keys` - 列出所有 API Key
- `DELETE /api/auth/api-keys/:id` - 删除 API Key
- `POST /api/auth/api-keys/:id/deactivate` - 停用 API Key

### 健康检查

- `GET /` - 健康检查端点（无需认证）

## 📚 API 文档

交互式 Swagger 文档位于：

**http://localhost:3000/api**

点击 "Authorize" 按钮配置 API Key 认证以进行测试。

## 🔐 认证

Pixuli Server 支持两种认证模式：

### 模式 1: 环境变量 API Key（简单）

在 `.env` 中设置 `API_KEY`：

```env
API_KEY=your-secret-api-key-here
```

### 模式 2: 数据库 API Key（完整）

启用数据库存储的 API Key：

```env
ENABLE_DB_API_KEYS=true
```

然后运行迁移并通过 API 创建 API Key。

**使用方式**：

```bash
# 使用 X-API-Key 头
curl -H "X-API-Key: your-api-key" http://localhost:3000/api/images

# 使用 Bearer token
curl -H "Authorization: Bearer your-api-key" http://localhost:3000/api/images
```

详细认证指南请参考 [认证文档](./docs/auth-design.md)。

## 💾 存储配置

### 本地存储（默认）

无需额外设置。文件存储在 `uploads/images/` 目录。

```env
STORAGE_TYPES=local
STORAGE_LOCAL_DIR=uploads/images
```

### MinIO 对象存储

1. **使用 Docker 启动 MinIO**：

```bash
docker-compose -f docker-compose.minio.yml up -d
```

2. **配置环境变量**：

```env
STORAGE_TYPES=minio
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=pixuli-images
MINIO_USE_SSL=false
```

3. **初始化存储桶**：

```bash
pnpm init:minio
```

### 双存储（备份）

同时使用本地和 MinIO 实现冗余：

```env
STORAGE_TYPES=local,minio
```

## 📁 项目结构

```
server/
├── src/
│   ├── auth/              # 认证模块
│   ├── images/             # 图片管理模块
│   ├── prisma/             # Prisma 服务
│   ├── storage/             # 存储适配器
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma       # 数据库 schema
│   └── migrations/         # 迁移文件
├── docs/                   # 文档
├── scripts/                 # 工具脚本
└── docker-compose.minio.yml # MinIO Docker Compose
```

## 📖 文档

- [存储设计](./docs/image-storage-desgin.md) - 存储架构和配置
- [认证设计](./docs/auth-design.md) - API Key 认证系统

## 🔧 故障排除

### 数据库连接失败

1. 验证 `.env` 中的 `DATABASE_URL` 是否正确
2. 确保 MySQL 服务正在运行
3. 检查数据库用户权限

### 迁移失败

1. 确保数据库已创建
2. 验证用户是否有 CREATE TABLE 权限
3. 查看错误日志获取详细信息

### MinIO 连接失败

1. 检查 MinIO 服务是否运行：`docker ps | grep minio`
2. 验证端点和凭据
3. 运行 `pnpm init:minio` 初始化存储桶

### 认证问题

1. 验证 `API_KEY` 已设置（模式 1）或 `ENABLE_DB_API_KEYS=true`（模式 2）
2. 检查请求头中是否包含 API Key
3. 验证 API Key 是否激活且未过期

## 🛠️ 技术栈

- **框架**: NestJS 11
- **数据库**: Prisma + MySQL/MariaDB
- **存储**: 本地文件系统、MinIO（S3 兼容）
- **认证**: Passport.js 自定义 API Key 策略
- **文档**: Swagger/OpenAPI
- **图片处理**: Sharp

## 📄 许可证

MIT 许可证 - 详情请参阅 [LICENSE](../LICENSE) 文件。

---

⭐ 如果这个项目对您有帮助，请给我们一个星标！
