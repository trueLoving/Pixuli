# Pixuli Server

Pixuli Server 是 Pixuli 智能图片管理应用的后端服务。

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置数据库

编辑 `.env` 文件，设置数据库连接：

```env
DATABASE_URL="mysql://用户名:密码@localhost:3306/pixuli"
PORT=6000
```

**示例：**

```env
DATABASE_URL="mysql://root:password@localhost:3306/pixuli"
PORT=6000
```

### 3. 创建数据库

在 MySQL 中执行：

```sql
CREATE DATABASE pixuli CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

或者使用提供的 SQL 文件：

```bash
mysql -u root -p < scripts/create-database.sql
```

### 4. 运行数据库迁移

创建数据库表结构：

```bash
pnpm prisma:migrate
```

### 5. 启动开发服务器

```bash
pnpm dev
```

服务器将在 `http://localhost:6000` 启动。

## 📋 可用命令

```bash
# 开发模式（热重载）
pnpm dev

# 构建项目
pnpm build

# 预览构建结果
pnpm preview

# Prisma 相关命令
pnpm prisma:generate      # 生成 Prisma Client
pnpm prisma:migrate        # 创建并应用数据库迁移
pnpm prisma:studio         # 打开 Prisma Studio（数据库可视化工具）
pnpm prisma:format         # 格式化 schema 文件

# 测试数据库连接
pnpm test:db
```

## 📁 项目结构

```
server/
├── prisma/
│   ├── schema.prisma      # 数据库 schema 定义
│   └── migrations/        # 数据库迁移文件
├── src/
│   ├── images/           # 图片管理模块
│   │   ├── dto/          # 数据传输对象
│   │   ├── interfaces/   # 接口定义
│   │   ├── images.controller.ts
│   │   ├── images.service.ts
│   │   └── images.module.ts
│   ├── prisma/           # Prisma 服务
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── app.module.ts
│   └── main.ts
└── uploads/              # 上传文件目录
    └── images/           # 图片存储目录
```

## 🔌 API 端点

### 图片管理

- `POST /api/images/upload` - 上传单张图片
- `POST /api/images/upload/multiple` - 批量上传图片
- `GET /api/images` - 获取所有图片列表
- `GET /api/images/:id` - 获取单张图片详情
- `GET /api/images/:id/file` - 获取图片文件
- `PUT /api/images/:id/metadata` - 更新图片元数据
- `DELETE /api/images/:id` - 删除图片
- `GET /api/images/tags/:tagName` - 根据标签获取图片列表

## 🗄️ 数据库 Schema

### Image 表

- `id` - UUID 主键
- `filename` - 存储的文件名
- `originalName` - 原始文件名
- `mimeType` - MIME 类型
- `title` - 图片标题
- `metadata` - JSON 格式的元数据（包含 size, width, height, description,
  tags 等）
- `path` - 文件存储路径
- `url` - 访问 URL
- `uploadDate` - 上传时间
- `updatedAt` - 更新时间

## 📝 注意事项

1. 确保 MySQL 服务正在运行
2. 确保数据库用户有创建表和索引的权限
3. 上传的文件存储在 `uploads/images/` 目录
4. 生产环境建议配置环境变量和数据库连接池

## 🔧 故障排除

### 数据库连接失败

1. 检查 `.env` 文件中的 `DATABASE_URL` 是否正确
2. 确认 MySQL 服务正在运行
3. 验证数据库用户权限

### 迁移失败

1. 确保数据库已创建
2. 检查数据库用户是否有创建表的权限
3. 查看错误日志获取详细信息
