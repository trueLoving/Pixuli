# 图片存储设计与配置指南

## 📋 概述

本文档介绍 Pixuli
Server 的图片存储架构设计、方案对比以及配置指南。系统支持多种存储后端，包括本地文件系统和 MinIO 对象存储，通过存储抽象层实现灵活切换。

## 🔍 存储方案对比

### 1. 本地文件夹存储（当前方案）

**实现方式：**

- 直接使用 Node.js 文件系统 API
- 文件存储在 `uploads/images/` 目录

**优点：**

- ✅ **简单直接**：无需额外服务，开箱即用
- ✅ **零配置**：不需要安装和配置额外组件
- ✅ **性能好**：本地 I/O，延迟最低
- ✅ **成本低**：无需额外服务费用
- ✅ **调试方便**：可以直接查看文件系统

**缺点：**

- ❌ **难以扩展**：单机存储，无法水平扩展
- ❌ **单点故障**：服务器故障会导致数据丢失
- ❌ **备份困难**：需要手动配置备份策略
- ❌ **不适合分布式**：多实例部署时文件不同步
- ❌ **磁盘容量限制**：受服务器磁盘空间限制

**适用场景：**

- 开发环境
- 小规模应用（图片数量 < 10万）
- 单机部署
- 对可用性要求不高的场景

---

### 2. S3FS / RustFS（文件系统挂载）

**实现方式：**

- 使用 FUSE 将对象存储挂载为本地文件系统
- 通过文件系统 API 访问对象存储

**优点：**

- ✅ **透明迁移**：代码改动最小，仍使用文件系统 API
- ✅ **兼容性好**：可以挂载多种对象存储（S3、MinIO、OSS 等）
- ✅ **统一接口**：所有存储看起来像本地文件系统

**缺点：**

- ❌ **性能较差**：网络延迟 + FUSE 开销，比直接 API 慢
- ❌ **稳定性问题**：网络波动可能导致文件操作失败
- ❌ **功能受限**：无法充分利用对象存储的高级特性（如预签名 URL）
- ❌ **调试困难**：问题排查复杂
- ❌ **额外依赖**：需要安装和配置 FUSE

**适用场景：**

- 需要快速迁移现有代码
- 对性能要求不高的场景
- 临时过渡方案

---

### 3. MinIO（对象存储服务）

**实现方式：**

- 使用 MinIO 客户端 SDK
- 通过 API 直接操作对象存储

**优点：**

- ✅ **S3 兼容**：完全兼容 AWS S3 API，可迁移到云服务
- ✅ **易于部署**：Docker 一键部署，支持分布式
- ✅ **高可用**：支持多节点部署、数据冗余
- ✅ **功能丰富**：支持预签名 URL、生命周期管理、版本控制
- ✅ **Web UI**：提供管理界面，方便运维
- ✅ **性能好**：直接 API 调用，比 FUSE 快
- ✅ **扩展性强**：可以轻松扩展到云存储（AWS S3、阿里云 OSS 等）
- ✅ **开源免费**：AGPL 许可证

**缺点：**

- ❌ **需要额外服务**：需要部署和维护 MinIO 服务
- ❌ **学习成本**：需要了解对象存储概念和 API
- ❌ **代码改动**：需要重构存储相关代码

**适用场景：**

- 生产环境
- 需要高可用性
- 需要水平扩展
- 未来可能迁移到云存储
- 图片数量较大（> 10万）

---

## 🏆 推荐方案

### **推荐：MinIO**

**理由：**

1. **未来可扩展性**
   - 代码可以无缝迁移到 AWS S3、阿里云 OSS、腾讯云 COS 等
   - 支持从本地 MinIO 平滑迁移到云存储

2. **生产就绪**
   - 支持分布式部署
   - 数据冗余和容错
   - 适合生产环境使用

3. **功能完整**
   - 预签名 URL（直接访问，减轻服务器压力）
   - 生命周期管理
   - 版本控制
   - 访问控制

4. **开发体验**
   - 提供 Web UI 管理界面
   - 完善的文档和社区支持
   - Docker 部署简单

### 📊 方案选择建议

| 场景                           | 推荐方案   | 原因                   |
| ------------------------------ | ---------- | ---------------------- |
| **开发/测试环境**              | 本地文件夹 | 简单快速，无需额外服务 |
| **小规模生产（< 10万图片）**   | 本地文件夹 | 成本低，性能好         |
| **中大规模生产（> 10万图片）** | **MinIO**  | 可扩展，高可用         |
| **需要云存储迁移**             | **MinIO**  | S3 兼容，易于迁移      |
| **多实例部署**                 | **MinIO**  | 统一存储，数据一致     |
| **快速原型**                   | 本地文件夹 | 开发效率高             |
| **需要预签名 URL**             | **MinIO**  | 支持直接访问           |

---

## 🚀 快速开始

### 1. 本地存储（默认）

无需额外配置，直接使用即可。

**环境变量：**

```env
STORAGE_TYPES=local
STORAGE_LOCAL_DIR=uploads/images
```

### 2. MinIO 对象存储

#### 步骤 1: 启动 MinIO 服务

**使用 Docker Compose（推荐）：**

```bash
docker-compose -f docker-compose.minio.yml up -d
```

**或使用 Docker 命令：**

```bash
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name pixuli-minio \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  -v minio-data:/data \
  minio/minio server /data --console-address ':9001'
```

#### 步骤 2: 配置环境变量

编辑 `.env` 文件：

```env
STORAGE_TYPES=minio
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=pixuli-images
MINIO_USE_SSL=false
```

#### 步骤 3: 初始化 MinIO 存储桶

```bash
pnpm init:minio
```

或手动在 MinIO Web UI 中创建存储桶：

1. 访问 http://localhost:9001
2. 使用 `minioadmin` / `minioadmin` 登录
3. 创建存储桶 `pixuli-images`

### 3. 同时使用本地和 MinIO（双写）

配置多个存储后端，实现数据冗余：

```env
STORAGE_TYPES=local,minio
```

**优势：**

- 数据自动备份到两个存储
- 本地存储快速访问
- MinIO 提供高可用性

---

## ⚙️ 环境变量说明

| 变量名              | 说明                       | 默认值           | 示例             |
| ------------------- | -------------------------- | ---------------- | ---------------- |
| `STORAGE_TYPES`     | 存储类型（多个用逗号分隔） | `local`          | `local,minio`    |
| `STORAGE_LOCAL_DIR` | 本地存储目录               | `uploads/images` | `uploads/images` |
| `MINIO_ENDPOINT`    | MinIO 服务端点             | `localhost:9000` | `localhost:9000` |
| `MINIO_ACCESS_KEY`  | MinIO 访问密钥             | `minioadmin`     | `minioadmin`     |
| `MINIO_SECRET_KEY`  | MinIO 秘密密钥             | `minioadmin`     | `minioadmin`     |
| `MINIO_BUCKET`      | MinIO 存储桶名称           | `pixuli-images`  | `pixuli-images`  |
| `MINIO_USE_SSL`     | 是否使用 SSL               | `false`          | `true`           |
| `MINIO_REGION`      | MinIO 区域                 | `us-east-1`      | `us-east-1`      |

---

## 🔧 存储适配器特性

### 本地存储适配器

- ✅ 零配置，开箱即用
- ✅ 性能最佳（本地 I/O）
- ✅ 适合开发和测试
- ❌ 不支持预签名 URL

### MinIO 存储适配器

- ✅ S3 兼容 API
- ✅ 支持预签名 URL（直接访问）
- ✅ 支持分布式部署
- ✅ 提供 Web UI 管理
- ✅ 可迁移到云存储（AWS S3、阿里云 OSS 等）

---

## 🏗️ 架构设计

### 存储抽象层

系统采用存储适配器模式，通过统一的接口支持多种存储后端：

```typescript
interface StorageAdapter {
  upload(file: Buffer, key: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getUrl(key: string): Promise<string>;
  getPresignedUrl(key: string, expiresIn?: number): Promise<string>;
}
```

**实现：**

- `LocalStorageAdapter` - 本地文件系统
- `MinIOStorageAdapter` - MinIO 对象存储
- `S3StorageAdapter` - AWS S3（未来扩展）

**优势：**

- 可以灵活切换存储后端
- 开发环境用本地，生产环境用 MinIO
- 代码解耦，易于测试
- 支持多存储后端同时运行（写时复制）

---

## 📡 API 使用

### 上传图片

```bash
curl -X POST http://localhost:6000/api/images/upload \
  -F "file=@image.jpg" \
  -F "title=我的图片"
```

### 获取图片

```bash
# 通过服务器代理
curl http://localhost:6000/api/images/{id}/file

# 获取预签名 URL（MinIO）
curl http://localhost:6000/api/images/{id}/presigned-url
```

---

## 🐳 MinIO 部署示例

### Docker Compose 配置

```yaml
version: '3.8'
services:
  minio:
    image: minio/minio:latest
    container_name: pixuli-minio
    ports:
      - '9000:9000' # API 端口
      - '9001:9001' # Web UI 端口
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio-data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:9000/minio/health/live']
      interval: 30s
      timeout: 20s
      retries: 3

volumes:
  minio-data:
```

---

## 🔄 实施建议

### 阶段 1：抽象存储接口（已完成）

创建一个存储抽象层，支持多种存储后端：

- ✅ `LocalStorageAdapter` - 本地文件系统
- ✅ `MinIOStorageAdapter` - MinIO 对象存储
- ✅ `StorageService` - 统一管理多个适配器

### 阶段 2：渐进式迁移

1. **开发环境**：继续使用本地存储
2. **测试环境**：部署 MinIO，验证功能
3. **生产环境**：切换到 MinIO

---

## 🛠️ 故障排除

### MinIO 连接失败

1. 检查 MinIO 服务是否运行：`docker ps | grep minio`
2. 验证端点地址和端口
3. 检查防火墙设置
4. 验证访问密钥和秘密密钥

### 存储桶不存在

运行初始化脚本：

```bash
pnpm init:minio
```

### 文件上传失败

1. 检查存储桶权限
2. 验证存储空间是否充足
3. 查看服务器日志获取详细错误信息

---

## 🚀 生产环境建议

1. **使用 MinIO 分布式模式**：提高可用性和性能
2. **配置 SSL/TLS**：保护数据传输
3. **设置访问策略**：限制存储桶访问权限
4. **启用生命周期管理**：自动清理过期文件
5. **配置备份策略**：定期备份重要数据
6. **监控存储使用**：设置存储配额和告警

---

## 📝 总结

**最佳实践：**

1. **短期（开发/小规模）**：使用本地文件夹存储
2. **长期（生产/扩展）**：使用 MinIO 对象存储
3. **架构设计**：抽象存储接口，支持灵活切换

**建议实施路径：**

1. ✅ 先实现存储抽象层（已完成）
2. 开发环境继续使用本地存储
3. 生产环境部署 MinIO
4. 通过配置切换存储后端

这样既能保证开发效率，又能为未来的扩展做好准备。
