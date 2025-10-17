# Pixuli Server

Pixuli Server 是 Pixuli 智能图片管理应用的后端服务组件，提供 MCP (Model Context Protocol) 服务器和自有图片仓库管理功能。

## 📋 项目概述

Pixuli Server 作为 Pixuli 生态系统的重要组成部分，主要负责：

1. **MCP-Server**: 提供 Model Context Protocol 服务器，支持 AI 模型的上下文管理和交互
2. **Own Image Repository**: 自有图片仓库管理，提供图片存储、检索和管理服务

## 🏗️ 架构设计

```mermaid
graph TB
    subgraph "Pixuli Server"
        A[MCP Server]
        B[Image Repository]
        C[API Gateway]
        D[Storage Layer]
    end
    
    subgraph "MCP Server"
        E[Model Context Manager]
        F[AI Model Interface]
        G[Context Storage]
        H[Protocol Handler]
    end
    
    subgraph "Image Repository"
        I[Image Storage]
        J[Metadata Management]
        K[Search Engine]
        L[Version Control]
    end
    
    subgraph "External Services"
        M[AI Models]
        N[File Storage]
        O[Database]
        P[Cache Layer]
    end
    
    A --> E
    A --> F
    A --> G
    A --> H
    
    B --> I
    B --> J
    B --> K
    B --> L
    
    C --> A
    C --> B
    
    D --> N
    D --> O
    D --> P
    
    E --> M
    F --> M
    I --> N
    J --> O
    K --> P
    
    style A fill:#e3f2fd
    style B fill:#e8f5e8
    style C fill:#fff3e0
    style D fill:#fce4ec
```

## 🚀 主要功能

### MCP Server 功能

- **模型上下文管理**: 维护 AI 模型的上下文状态和历史记录
- **多模型支持**: 支持 TensorFlow、ONNX、本地 LLM 等多种 AI 模型
- **协议兼容**: 完全兼容 Model Context Protocol 标准
- **实时交互**: 提供实时的模型交互和响应服务
- **上下文持久化**: 支持上下文的持久化存储和恢复

### Image Repository 功能

- **图片存储管理**: 高效的图片存储和检索系统
- **元数据管理**: 完整的图片元数据存储和管理
- **版本控制**: 支持图片的版本控制和历史管理
- **智能搜索**: 基于 AI 的图片内容搜索和分类
- **批量处理**: 支持图片的批量上传、处理和转换
- **API 接口**: 提供完整的 RESTful API 接口

## 🛠️ 技术栈

### 核心技术
- **Node.js**: 服务器运行环境
- **TypeScript**: 类型安全的开发语言
- **Express.js**: Web 应用框架
- **Fastify**: 高性能 Web 框架（可选）

### 数据存储
- **PostgreSQL**: 主数据库，存储元数据和配置
- **Redis**: 缓存和会话存储
- **MinIO/S3**: 对象存储，存储图片文件
- **Elasticsearch**: 全文搜索和索引

### AI 和机器学习
- **TensorFlow.js**: 浏览器端 AI 模型运行
- **ONNX Runtime**: 跨平台 AI 模型推理
- **Transformers.js**: 自然语言处理模型

### 监控和日志
- **Prometheus**: 指标收集和监控
- **Grafana**: 监控面板和可视化
- **Winston**: 日志记录和管理
- **Sentry**: 错误跟踪和报告

## 📁 目录结构

```
server/
├── src/                          # 源代码目录
│   ├── mcp/                      # MCP Server 实现
│   │   ├── server.ts            # MCP 服务器主文件
│   │   ├── handlers/            # 协议处理器
│   │   ├── models/              # 模型管理
│   │   └── context/             # 上下文管理
│   ├── repository/              # 图片仓库服务
│   │   ├── storage/             # 存储层
│   │   ├── metadata/            # 元数据管理
│   │   ├── search/              # 搜索服务
│   │   └── api/                 # API 接口
│   ├── shared/                  # 共享组件
│   │   ├── database/            # 数据库连接
│   │   ├── cache/               # 缓存管理
│   │   ├── auth/                # 认证授权
│   │   └── utils/               # 工具函数
│   └── config/                  # 配置文件
├── tests/                       # 测试代码
│   ├── unit/                    # 单元测试
│   ├── integration/             # 集成测试
│   └── e2e/                     # 端到端测试
├── docs/                        # 文档
│   ├── api/                     # API 文档
│   ├── deployment/              # 部署文档
│   └── development/             # 开发文档
├── scripts/                     # 脚本文件
├── docker/                      # Docker 配置
├── package.json                 # 项目配置
├── tsconfig.json                # TypeScript 配置
├── .env.example                 # 环境变量示例
└── README.md                    # 项目说明
```

## 🚀 快速开始

### 环境要求

- Node.js >= 22.0.0
- pnpm >= 8.0.0
- PostgreSQL >= 14.0
- Redis >= 6.0
- Docker (可选)

### 安装和运行

1. **克隆项目**
   ```bash
   git clone https://github.com/trueLoving/pixuli.git
   cd pixuli/server
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，配置数据库连接等信息
   ```

4. **初始化数据库**
   ```bash
   pnpm run db:migrate
   pnpm run db:seed
   ```

5. **启动开发服务器**
   ```bash
   pnpm run dev
   ```

6. **构建生产版本**
   ```bash
   pnpm run build
   pnpm run start
   ```

### Docker 部署

```bash
# 构建镜像
docker build -t pixuli-server .

# 运行容器
docker run -p 3000:3000 --env-file .env pixuli-server
```

## 📚 API 文档

### MCP Server API

#### 模型管理
- `POST /mcp/models/register` - 注册新模型
- `GET /mcp/models` - 获取可用模型列表
- `DELETE /mcp/models/:id` - 删除模型

#### 上下文管理
- `POST /mcp/context/create` - 创建新上下文
- `GET /mcp/context/:id` - 获取上下文信息
- `PUT /mcp/context/:id` - 更新上下文
- `DELETE /mcp/context/:id` - 删除上下文

#### 模型交互
- `POST /mcp/invoke` - 调用模型推理
- `GET /mcp/status/:id` - 获取模型状态

### Image Repository API

#### 图片管理
- `POST /api/images/upload` - 上传图片
- `GET /api/images` - 获取图片列表
- `GET /api/images/:id` - 获取图片详情
- `PUT /api/images/:id` - 更新图片信息
- `DELETE /api/images/:id` - 删除图片

#### 搜索和分类
- `GET /api/images/search` - 搜索图片
- `GET /api/images/tags` - 获取标签列表
- `POST /api/images/:id/tags` - 添加标签
- `DELETE /api/images/:id/tags/:tag` - 删除标签

#### 批量操作
- `POST /api/images/batch/upload` - 批量上传
- `POST /api/images/batch/process` - 批量处理
- `POST /api/images/batch/delete` - 批量删除

## 🔧 配置说明

### 环境变量

```bash
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/pixuli
REDIS_URL=redis://localhost:6379

# 存储配置
STORAGE_TYPE=minio
STORAGE_ENDPOINT=localhost:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=pixuli-images

# AI 模型配置
AI_MODEL_PATH=./models
AI_CACHE_SIZE=1000
AI_TIMEOUT=30000

# 认证配置
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# 监控配置
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
```

## 🧪 测试

```bash
# 运行所有测试
pnpm test

# 运行单元测试
pnpm test:unit

# 运行集成测试
pnpm test:integration

# 运行端到端测试
pnpm test:e2e

# 生成测试覆盖率报告
pnpm test:coverage
```

## 📊 监控和日志

### 监控指标

- **性能指标**: 响应时间、吞吐量、错误率
- **资源指标**: CPU、内存、磁盘使用率
- **业务指标**: 图片上传量、处理成功率、用户活跃度

### 日志级别

- **ERROR**: 错误日志，需要立即处理
- **WARN**: 警告日志，需要关注
- **INFO**: 信息日志，记录重要操作
- **DEBUG**: 调试日志，开发时使用

## 🚀 部署

### 生产环境部署

1. **使用 Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **使用 Kubernetes**
   ```bash
   kubectl apply -f k8s/
   ```

3. **使用 PM2**
   ```bash
   pm2 start ecosystem.config.js
   ```

### 性能优化

- 启用 Redis 缓存
- 配置 CDN 加速
- 使用负载均衡
- 优化数据库查询
- 启用压缩和静态资源优化

## 🤝 贡献指南

1. Fork 仓库
2. 创建功能分支: `git checkout -b feature/your-feature`
3. 提交更改: `git commit -m 'Add some feature'`
4. 推送分支: `git push origin feature/your-feature`
5. 创建 Pull Request

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 和 Prettier 配置
- 编写单元测试和集成测试
- 更新相关文档

## 📄 许可证

本项目采用 [MIT 许可证](../LICENSE)

## 🙏 致谢

- [Model Context Protocol](https://modelcontextprotocol.io/) - AI 模型上下文协议
- [Express.js](https://expressjs.com/) - Web 应用框架
- [PostgreSQL](https://www.postgresql.org/) - 关系型数据库
- [Redis](https://redis.io/) - 内存数据库
- [TensorFlow.js](https://www.tensorflow.org/js) - JavaScript 机器学习库

---

⭐ 如果这个项目对您有帮助，请给我们一个星标！