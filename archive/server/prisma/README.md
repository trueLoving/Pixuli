# Prisma 数据库配置

## 数据库 Schema 设计

### Image 表（图片表）

存储图片的元数据和文件信息。所有扩展信息都存储在 `metadata` JSON 字段中。

| 字段         | 类型          | 说明                                                                |
| ------------ | ------------- | ------------------------------------------------------------------- |
| id           | String (UUID) | 主键，唯一标识符                                                    |
| filename     | String        | 存储的文件名                                                        |
| originalName | String        | 原始文件名                                                          |
| mimeType     | String        | MIME 类型（如 image/jpeg）                                          |
| title        | String?       | 图片标题（可选）                                                    |
| metadata     | Json          | 元数据（JSON 格式，包含 size, width, height, description, tags 等） |
| path         | String        | 文件存储路径                                                        |
| url          | String        | 访问 URL                                                            |
| uploadDate   | DateTime      | 上传时间                                                            |
| updatedAt    | DateTime      | 最后更新时间                                                        |

**metadata 字段结构：**

```json
{
  "size": 1024000, // 文件大小（字节，必需）
  "width": 1920, // 图片宽度（像素，可选）
  "height": 1080, // 图片高度（像素，可选）
  "description": "图片描述", // 图片描述（可选）
  "tags": ["标签1", "标签2"] // 标签数组（可选）
  // 其他自定义字段...
}
```

**索引：**

- `uploadDate` - 用于按上传时间排序
- `mimeType` - 用于按文件类型筛选
- `title` - 用于按标题搜索

---

## 数据库设置步骤

### 步骤 1: 配置数据库连接

编辑 `.env` 文件，设置 `DATABASE_URL`：

```env
DATABASE_URL="mysql://用户名:密码@主机:端口/数据库名"
```

**示例：**

```env
DATABASE_URL="mysql://root:password@localhost:3306/pixuli"
PORT=6000
```

### 步骤 2: 创建数据库

在 MySQL 中创建数据库（如果还没有）：

```sql
CREATE DATABASE pixuli CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

或者使用提供的 SQL 文件：

```bash
mysql -u root -p < scripts/create-database.sql
```

### 步骤 3: 运行数据库迁移

运行以下命令创建表结构：

```bash
pnpm prisma:migrate
```

或者使用完整命令：

```bash
pnpm prisma migrate dev --name init
```

这会：

- 创建 `images` 表
- 创建所有必要的索引
- 生成迁移文件

### 步骤 4: 验证数据库连接

测试数据库连接：

```bash
pnpm test:db
```

---

## 常用命令

```bash
# 生成 Prisma Client
pnpm prisma:generate

# 创建并应用数据库迁移
pnpm prisma:migrate

# 打开 Prisma Studio（数据库可视化工具）
pnpm prisma:studio

# 格式化 schema 文件
pnpm prisma:format
```

## 数据库迁移

Prisma 使用迁移来管理数据库 schema 的变更：

1. **创建迁移**：修改 `prisma/schema.prisma` 后运行 `pnpm prisma:migrate`
2. **迁移文件**：保存在 `prisma/migrations/` 目录
3. **应用迁移**：迁移会自动应用到数据库

## 注意事项

- 确保 MySQL 服务正在运行
- 确保数据库用户有创建表和索引的权限
- 生产环境建议使用连接池和 SSL 连接
- `metadata` 字段使用 JSON 类型，可以存储任意结构的数据
- 所有扩展信息（size, width, height, description, tags）都存储在 metadata 中

## 数据示例

### 图片数据示例

```json
{
  "id": "uuid-here",
  "filename": "abc123.jpg",
  "originalName": "my-photo.jpg",
  "mimeType": "image/jpeg",
  "title": "美丽的风景",
  "metadata": {
    "size": 1024000,
    "width": 1920,
    "height": 1080,
    "description": "这是一张风景照片",
    "tags": ["风景", "旅行", "自然"],
    "camera": "Canon EOS 5D",
    "location": "北京",
    "date": "2024-01-01"
  },
  "uploadDate": "2024-01-01T00:00:00.000Z",
  "url": "/api/images/uuid-here/file",
  "path": "uuid-here.jpg"
}
```

---

## 常见问题

### 1. 认证失败

如果遇到 `Authentication failed` 错误：

- 检查用户名和密码是否正确
- 确认 MySQL 服务正在运行
- 验证用户是否有访问该数据库的权限

### 2. 数据库不存在

如果遇到 `Unknown database` 错误：

- 先创建数据库（见步骤 2）
- 确保数据库名称与 DATABASE_URL 中的一致

### 3. 连接被拒绝

如果遇到 `Connection refused` 错误：

- 确认 MySQL 服务正在运行
- 检查端口号是否正确（默认 3306）
- 验证防火墙设置

### 4. 迁移失败

如果迁移失败：

- 确保数据库已创建
- 检查数据库用户是否有创建表的权限
- 查看错误日志获取详细信息

### 5. 表已存在错误

如果遇到表已存在的错误：

- 可以删除现有表后重新迁移
- 或者使用 `prisma migrate reset` 重置数据库（**注意：会删除所有数据**）

---

## 生产环境建议

1. **使用连接池**：配置数据库连接池以提高性能
2. **启用 SSL**：生产环境建议使用 SSL 连接
3. **定期备份**：设置数据库自动备份策略
4. **监控性能**：监控数据库查询性能和连接数
5. **索引优化**：根据查询模式添加适当的索引
