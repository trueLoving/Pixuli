# 认证系统设计文档

Pixuli Server 实现了灵活的 API
Key 认证系统，支持两种使用模式，为未来扩展做好准备。

## 📖 目录

- [已实现功能](#已实现功能)
- [认证方式](#认证方式)
- [使用指南](#使用指南)
- [架构设计](#架构设计)
- [安全考虑](#安全考虑)
- [未来规划](#未来规划)

## ✅ 已实现功能

### 1. 双模式认证系统

#### 模式 1: 环境变量 API Key（简单模式）

- ✅ 通过环境变量 `API_KEY` 配置
- ✅ 适合单用户/小团队
- ✅ 零配置，开箱即用

#### 模式 2: 数据库 API Key（完整模式）

- ✅ 通过环境变量 `ENABLE_DB_API_KEYS=true` 启用
- ✅ 支持多 API Key 管理
- ✅ 支持过期时间设置
- ✅ 支持启用/禁用
- ✅ 记录最后使用时间

### 2. 认证机制

- ✅ 支持 `Authorization: Bearer <api-key>` 格式
- ✅ 支持 `X-API-Key: <api-key>` 头
- ✅ 支持查询参数 `?apiKey=<api-key>`（不推荐）
- ✅ 全局 Guard 保护所有端点
- ✅ `@Public()` 装饰器标记公开端点

### 3. API Key 管理

- ✅ 创建 API Key
- ✅ 列出所有 API Key（不返回实际 key）
- ✅ 删除 API Key
- ✅ 停用 API Key
- ✅ API Key 哈希存储（安全）

### 4. Swagger 集成

- ✅ Swagger UI 中配置认证
- ✅ 支持两种认证方式（X-API-Key 和 Bearer）
- ✅ 所有端点文档包含认证说明

## 🎯 认证方式

### 方式 1: 环境变量 API Key（简单模式）

适合单用户或小团队使用，通过环境变量配置。

#### 配置步骤

1. 在 `.env` 文件中设置 API Key：

```env
API_KEY=your-secret-api-key-here
```

2. 重启服务器，所有 API 端点将使用该 API Key 进行认证。

#### 使用方式

在请求头中添加 API Key：

```bash
# 方式 1: 使用 X-API-Key 头
curl -H "X-API-Key: your-secret-api-key-here" http://localhost:3000/api/images

# 方式 2: 使用 Bearer Token
curl -H "Authorization: Bearer your-secret-api-key-here" http://localhost:3000/api/images
```

### 方式 2: 数据库 API Key（完整模式）

适合需要多用户、多 API Key 管理的场景。

#### 启用步骤

1. 在 `.env` 文件中启用数据库 API Key：

```env
ENABLE_DB_API_KEYS=true
```

2. 运行数据库迁移（创建 API Key 表）：

```bash
pnpm prisma migrate dev
```

3. 创建第一个 API Key（需要先有一个有效的 API Key 或临时禁用认证）：

```bash
# 方式 1: 通过 API 创建（需要先有环境变量 API_KEY）
curl -X POST http://localhost:3000/api/auth/api-keys \
  -H "X-API-Key: your-env-api-key" \
  -H "Content-Type: application/json" \
  -d '{"name": "Production API Key"}'

# 方式 2: 通过 Prisma Studio 手动创建
pnpm prisma studio
```

#### API Key 管理端点

- `POST /api/auth/api-keys` - 创建新的 API Key
- `GET /api/auth/api-keys` - 列出所有 API Key（不返回实际 key 值）
- `DELETE /api/auth/api-keys/:id` - 删除 API Key
- `POST /api/auth/api-keys/:id/deactivate` - 停用 API Key

## 📝 使用指南

### 使用建议

#### 当前阶段（推荐）

**使用方式 1（环境变量 API Key）**：

- 适合当前项目阶段
- 简单快速，无需数据库迁移
- 满足基本安全需求

配置示例：

```env
API_KEY=your-strong-random-key-here
```

#### 未来升级路径

当需要以下功能时，升级到方式 2：

1. **多用户支持**：不同用户/应用使用不同的 API Key
2. **API Key 管理**：需要创建、删除、禁用 API Key
3. **使用追踪**：查看 API Key 使用情况
4. **过期管理**：设置 API Key 过期时间

升级步骤：

1. 设置 `ENABLE_DB_API_KEYS=true`
2. 运行 `pnpm prisma migrate dev`
3. 使用环境变量 API Key 创建第一个数据库 API Key
4. 使用新 API Key 替换环境变量

### 使用示例

#### 创建 API Key

```bash
curl -X POST http://localhost:3000/api/auth/api-keys \
  -H "X-API-Key: your-existing-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My API Key",
    "expiresAt": "2025-12-31T23:59:59Z"
  }'
```

响应：

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "key": "pk_abc123def456...",
  "name": "My API Key"
}
```

**重要**: 保存返回的 `key` 值，之后无法再次获取！

#### 使用 API Key 访问接口

```bash
# 上传图片
curl -X POST http://localhost:3000/api/images/upload \
  -H "X-API-Key: pk_abc123def456..." \
  -F "file=@image.jpg" \
  -F "title=My Image" \
  -F "tagNames[]=nature" \
  -F "tagNames[]=landscape"
```

#### 列出所有 API Key

```bash
curl http://localhost:3000/api/auth/api-keys \
  -H "X-API-Key: your-api-key"
```

响应：

```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Production API Key",
    "isActive": true,
    "lastUsedAt": "2025-01-15T10:30:00.000Z",
    "expiresAt": null,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
]
```

### 迁移路径

#### 从环境变量模式迁移到数据库模式

1. 设置环境变量 `ENABLE_DB_API_KEYS=true`
2. 运行数据库迁移
3. 使用环境变量 API Key 创建第一个数据库 API Key
4. 使用新创建的数据库 API Key 替换环境变量 API Key
5. 可选：移除环境变量 `API_KEY`（如果不再需要）

### Swagger 文档

访问 `http://localhost:3000/api` 查看完整的 API 文档，包括：

- 认证配置说明
- 所有端点的详细文档
- 在线测试功能

在 Swagger UI 中，点击右上角的 "Authorize" 按钮，输入您的 API Key 即可测试接口。

### 注意事项

1. **健康检查端点** (`GET /`) 不需要认证，用于监控服务状态
2. **Swagger 文档** (`GET /api`) 默认不需要认证，但测试接口时需要提供 API Key
3. 如果同时设置了环境变量 `API_KEY` 和启用了数据库模式，环境变量模式优先
4. API Key 在数据库中存储为哈希值，无法恢复原始值

## 🏗️ 架构设计

### 当前架构

```
┌─────────────────┐
│   API Request   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ApiKeyGuard    │ (全局 Guard)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ApiKeyStrategy  │ (提取 API Key)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   AuthService   │ (验证 API Key)
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│ Env    │ │ Database  │
│ API Key│ │ API Keys  │
└────────┘ └──────────┘
```

### 扩展性设计

当前实现已经为未来扩展做好准备：

1. **模块化设计**：AuthModule 独立，易于扩展
2. **策略模式**：ApiKeyStrategy 可扩展为其他认证策略
3. **装饰器模式**：`@Public()` 可扩展为 `@Roles()`、`@Permissions()` 等
4. **服务层抽象**：AuthService 可扩展为支持多种认证方式

### 代码结构

```
server/src/auth/
├── auth.module.ts           # 认证模块
├── auth.service.ts           # 认证服务（验证逻辑）
├── auth.controller.ts       # API Key 管理端点
├── guards/
│   └── api-key.guard.ts     # API Key Guard
├── strategies/
│   └── api-key.strategy.ts  # Passport 策略
└── decorators/
    └── public.decorator.ts  # 公开端点装饰器
```

## 🔒 安全考虑

### 已实现的安全措施

1. ✅ API Key 哈希存储（SHA-256）
2. ✅ 原始 API Key 只返回一次
3. ✅ 支持过期时间
4. ✅ 支持启用/禁用
5. ✅ 全局认证保护

### 建议的安全增强

1. **传输安全**：
   - 强制使用 HTTPS（生产环境）
   - 避免在 URL 中传递 API Key

2. **存储安全**：
   - 使用更强的哈希算法（如 bcrypt）
   - 考虑使用密钥管理服务（如 AWS Secrets Manager）

3. **访问控制**：
   - 实现基于 IP 的访问限制
   - 实现速率限制
   - 实现权限范围限制

### 安全建议

1. **环境变量模式**：
   - 使用强随机字符串作为 API Key
   - 不要在代码中硬编码 API Key
   - 定期轮换 API Key

2. **数据库模式**：
   - 为不同环境创建不同的 API Key
   - 设置合理的过期时间
   - 及时停用不再使用的 API Key
   - 定期检查 API Key 使用情况

3. **通用建议**：
   - 使用 HTTPS 传输 API Key
   - 不要在 URL 查询参数中传递 API Key（虽然支持，但不推荐）
   - 限制 API Key 的权限范围（未来功能）

## 🔮 未来规划

### 阶段 1: 当前实现 ✅

- [x] 环境变量 API Key
- [x] 数据库 API Key
- [x] 基础认证 Guard

### 阶段 2: 权限细化（建议）

- [ ] 基于角色的访问控制 (RBAC)
- [ ] API Key 权限范围（只读、读写、管理等）
- [ ] 端点级别的权限控制
- [ ] 使用配额限制

### 阶段 3: 与 Web 端集成（建议）

- [ ] 统一认证系统（共享认证逻辑）
- [ ] 用户登录/注册系统
- [ ] JWT Token 支持
- [ ] OAuth2 支持
- [ ] 前端管理界面

### 阶段 4: 高级功能（可选）

- [ ] API Key 使用统计和分析
- [ ] 速率限制（Rate Limiting）
- [ ] IP 白名单
- [ ] Webhook 支持

## 🚀 下一步行动

1. **立即使用**：
   - 在 `.env` 中设置 `API_KEY`
   - 重启服务器
   - 所有 API 端点将受保护

2. **测试认证**：
   - 访问 Swagger UI (`http://localhost:3000/api`)
   - 点击 "Authorize" 按钮
   - 输入 API Key 测试接口

3. **升级到数据库模式**（可选）：
   - 设置 `ENABLE_DB_API_KEYS=true`
   - 运行数据库迁移
   - 创建第一个 API Key

## 💡 最佳实践

1. **开发环境**：使用环境变量模式，简单快速
2. **生产环境**：使用数据库模式，便于管理
3. **API Key 命名**：使用有意义的名称（如 "Production API Key"）
4. **定期轮换**：定期更换 API Key
5. **监控使用**：定期检查 API Key 使用情况
6. **及时清理**：删除不再使用的 API Key
