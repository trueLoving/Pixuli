# 存储适配层

## 概述

存储适配层提供了统一的存储接口，支持多种存储后端。通过环境变量配置，可以灵活选择使用哪种存储服务，甚至同时使用多个存储服务（实现数据冗余）。

## 架构设计

```
StorageService (存储服务)
    ├── LocalStorageAdapter (本地存储)
    └── MinIOStorageAdapter (MinIO 对象存储)
```

### 核心特性

1. **统一接口**：所有存储适配器实现相同的 `StorageAdapter` 接口
2. **多存储支持**：可以同时启用多个存储后端
3. **自动冗余**：上传时自动写入所有启用的存储
4. **灵活切换**：通过环境变量配置，无需修改代码
5. **容错处理**：单个存储失败不影响其他存储

## 存储适配器接口

```typescript
interface StorageAdapter {
  upload(file: Buffer, key: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getUrl(key: string): Promise<string>;
  getPresignedUrl?(key: string, expiresIn?: number): Promise<string>;
}
```

## 已实现的适配器

### 1. LocalStorageAdapter（本地存储）

- **实现**：`src/storage/adapters/local-storage.adapter.ts`
- **特点**：使用本地文件系统存储
- **适用场景**：开发环境、小规模应用

### 2. MinIOStorageAdapter（MinIO 对象存储）

- **实现**：`src/storage/adapters/minio-storage.adapter.ts`
- **特点**：S3 兼容的对象存储
- **适用场景**：生产环境、大规模应用、需要高可用性

## 配置方式

### 环境变量

在 `.env` 文件中配置：

```env
# 存储类型（支持多个，用逗号分隔）
STORAGE_TYPES=local,minio

# 本地存储配置
STORAGE_LOCAL_DIR=uploads/images

# MinIO 配置
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=pixuli-images
MINIO_USE_SSL=false
```

### 配置示例

**仅使用本地存储：**

```env
STORAGE_TYPES=local
```

**仅使用 MinIO：**

```env
STORAGE_TYPES=minio
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=pixuli-images
```

**同时使用本地和 MinIO（双写）：**

```env
STORAGE_TYPES=local,minio
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=pixuli-images
```

## 使用方式

### 在服务中注入 StorageService

```typescript
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ImagesService {
  constructor(private readonly storageService: StorageService) {}

  async uploadImage(file: Buffer, key: string) {
    // 上传到所有启用的存储
    const storageKey = await this.storageService.upload(file, key);
    return storageKey;
  }

  async downloadImage(key: string) {
    // 从主存储下载
    return this.storageService.download(key);
  }

  async deleteImage(key: string) {
    // 从所有启用的存储删除
    await this.storageService.delete(key);
  }
}
```

## 工作原理

### 上传流程

1. 调用 `storageService.upload(file, key)`
2. 遍历所有启用的适配器
3. 并行上传到所有存储后端
4. 如果部分失败，记录警告但继续
5. 返回主适配器的结果

### 下载流程

1. 调用 `storageService.download(key)`
2. 从主适配器（第一个）下载
3. 如果失败，抛出异常

### 删除流程

1. 调用 `storageService.delete(key)`
2. 并行删除所有启用的存储
3. 使用 `Promise.allSettled` 确保所有删除操作都执行

## 扩展新的存储适配器

### 步骤 1: 实现 StorageAdapter 接口

```typescript
import { Injectable } from '@nestjs/common';
import { StorageAdapter } from '../interfaces/storage-adapter.interface';

@Injectable()
export class MyStorageAdapter implements StorageAdapter {
  async upload(file: Buffer, key: string): Promise<string> {
    // 实现上传逻辑
  }

  async download(key: string): Promise<Buffer> {
    // 实现下载逻辑
  }

  // ... 实现其他方法
}
```

### 步骤 2: 在 StorageModule 中注册

```typescript
@Module({
  providers: [
    StorageService,
    LocalStorageAdapter,
    MinIOStorageAdapter,
    MyStorageAdapter, // 添加新适配器
  ],
  exports: [StorageService],
})
export class StorageModule {}
```

### 步骤 3: 在 StorageService 中添加支持

```typescript
constructor(
  private readonly localStorageAdapter: LocalStorageAdapter,
  private readonly minIOStorageAdapter: MinIOStorageAdapter,
  private readonly myStorageAdapter: MyStorageAdapter, // 注入新适配器
) {
  // 在 switch 中添加新类型
  case 'mystorage':
    this.adapters.push(this.myStorageAdapter);
    break;
}
```

### 步骤 4: 配置环境变量

```env
STORAGE_TYPES=local,minio,mystorage
MY_STORAGE_CONFIG=...
```

## 最佳实践

1. **开发环境**：使用 `STORAGE_TYPES=local`
2. **生产环境**：使用 `STORAGE_TYPES=minio` 或 `STORAGE_TYPES=local,minio`
3. **数据冗余**：配置多个存储类型实现自动备份
4. **性能优化**：使用预签名 URL 减轻服务器压力（MinIO）
5. **错误处理**：存储服务会自动处理部分失败的情况

## 故障排除

### MinIO 适配器初始化失败

- 检查 MinIO 服务是否运行
- 验证环境变量配置
- 查看服务器启动日志

### 文件上传失败

- 检查存储空间是否充足
- 验证存储权限
- 查看具体错误信息

### 多存储配置问题

- 确保至少有一个存储适配器可用
- 检查环境变量格式（用逗号分隔）
- 验证每个存储后端的配置
