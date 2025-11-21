# 私有仓库图片访问权限控制设计文档

## 1. 概述

本文档描述了对 GitHub 和 Gitee 私有仓库图片访问进行权限控制的设计方案。该方案支持私有仓库的图片访问需要携带 token，同时保证对公开仓库的向下兼容。

## 2. 现状分析

### 2.1 当前实现

#### GitHub

- **API 请求**: 使用 `Authorization: token ${token}` 请求头
- **图片 URL**: 使用 GitHub API 返回的 `download_url`
- **问题**: 对于私有仓库，`download_url`
  需要 token 才能访问，但浏览器直接访问时无法携带 token

#### Gitee

- **API 请求**: 使用 `access_token` 作为查询参数
- **图片 URL**: 使用 `getRawUrl()` 生成的 raw
  URL 格式：`https://gitee.com/{owner}/{repo}/raw/{branch}/{path}`
- **问题**: 对于私有仓库，raw URL 需要 token 才能访问

### 2.2 现有代理机制

Web 端已存在 Gitee 代理 (`apps/web/api/gitee-proxy.js`)，但目前未处理 token 认证。

## 3. 设计方案

### 3.1 核心原则

1. **向下兼容**: 公开仓库的图片访问方式保持不变
2. **自动检测**: 自动检测仓库是否为私有，无需用户手动配置
3. **安全优先**: Token 不暴露在前端 URL 中（通过代理或请求头传递）
4. **多平台支持**: 支持 Web、Desktop、Mobile 三个平台

### 3.2 技术方案

#### 方案 A: 代理服务器方案（推荐）

**适用平台**: Web 端

**实现方式**:

- 使用服务器端代理转发图片请求
- 在代理中添加 token 认证
- 前端通过代理 URL 访问图片

**优点**:

- Token 不暴露在前端
- 支持所有类型的仓库（公开/私有）
- 统一的访问方式

**缺点**:

- 需要服务器资源
- 增加一次网络跳转

#### 方案 B: URL Token 方案

**适用平台**: Desktop、Mobile（直接访问）

**实现方式**:

- 对于私有仓库，在 URL 中添加 token 参数
- GitHub: 使用带 token 的 URL（需要特殊处理）
- Gitee: 在 raw URL 中添加 `access_token` 参数

**优点**:

- 无需额外服务器
- 实现简单

**缺点**:

- Token 暴露在 URL 中（安全性较低）
- 需要检测仓库类型

#### 方案 C: 混合方案（最终采用）

结合方案 A 和方案 B，根据平台和仓库类型选择最优方案。

## 4. 详细设计

### 4.1 仓库类型检测

在获取图片列表时，同时检测仓库是否为私有：

```typescript
interface RepoInfo {
  isPrivate: boolean;
  // 其他仓库信息...
}
```

**GitHub API**:

```typescript
// GET /repos/{owner}/{repo}
// 响应中包含 private 字段
const repoInfo = await makeGitHubRequest(`/repos/${owner}/${repo}`);
const isPrivate = repoInfo.private;
```

**Gitee API**:

```typescript
// GET /repos/{owner}/{repo}
// 响应中包含 private 字段
const repoInfo = await makeGiteeRequest(`/repos/${owner}/${repo}`);
const isPrivate = repoInfo.private;
```

### 4.2 图片 URL 生成策略

#### 4.2.1 GitHub

**公开仓库**:

```typescript
url: item.download_url; // 直接使用 API 返回的 URL
```

**私有仓库 - Web 端**:

```typescript
// 使用代理服务器
url: `/api/github-proxy/${owner}/${repo}/raw/${branch}/${path}`;
// 代理服务器在请求头中添加 Authorization: token ${token}
```

**私有仓库 - Desktop/Mobile 端**:

```typescript
// 方案1: 使用 GitHub API 的 contents API（需要 base64 解码）
// 方案2: 使用带 token 的 URL（GitHub 支持在 URL 中添加 token）
url: `${item.download_url}?token=${token}`;
// 注意: GitHub 的 download_url 不支持直接添加 token，需要使用 contents API
```

#### 4.2.2 Gitee

**公开仓库**:

```typescript
url: `https://gitee.com/${owner}/${repo}/raw/${branch}/${path}`;
```

**私有仓库 - Web 端**:

```typescript
// 使用代理服务器
url: `/api/gitee-proxy/${owner}/${repo}/raw/${branch}/${path}`;
// 代理服务器在 URL 中添加 access_token 参数
```

**私有仓库 - Desktop/Mobile 端**:

```typescript
// 在 URL 中添加 access_token 参数
url: `https://gitee.com/${owner}/${repo}/raw/${branch}/${path}?access_token=${token}`;
```

### 4.3 配置扩展

在配置接口中添加仓库类型标识（可选，用于缓存检测结果）：

```typescript
interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  path: string;
  isPrivate?: boolean; // 可选，缓存仓库类型
}

interface GiteeConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  path: string;
  isPrivate?: boolean; // 可选，缓存仓库类型
}
```

### 4.4 代理服务器实现

#### 4.4.1 GitHub 代理 (Web 端)

创建 `apps/web/api/github-proxy.js`:

```javascript
export default async function handler(req, res) {
  // 只允许 GET, HEAD, OPTIONS 请求
  if (
    req.method !== 'GET' &&
    req.method !== 'HEAD' &&
    req.method !== 'OPTIONS'
  ) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    return res.status(200).end();
  }

  try {
    // 从路径中提取 GitHub 路径
    // 格式: /api/github-proxy/{owner}/{repo}/raw/{branch}/{path}
    let githubPath = req.query.path || '';

    if (!githubPath && req.url) {
      const urlMatch = req.url.match(/\/api\/github-proxy\/?(.+)$/);
      if (urlMatch && urlMatch[1]) {
        githubPath = urlMatch[1].split('?')[0];
      }
    }

    if (!githubPath) {
      return res.status(400).json({ error: 'Invalid path' });
    }

    // 从请求头或查询参数获取 token（优先从请求头获取，更安全）
    const token = req.headers['x-github-token'] || req.query.token;

    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    // 构建 GitHub raw URL
    // 如果路径已经是 raw URL 格式，直接使用；否则构建
    let githubUrl;
    if (githubPath.startsWith('http')) {
      githubUrl = githubPath;
    } else {
      githubUrl = `https://raw.githubusercontent.com/${githubPath}`;
    }

    // 发起请求到 GitHub，添加 token 认证
    const response = await fetch(githubUrl, {
      method: req.method,
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'Pixuli-Web/1.0',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch: ${response.status} ${response.statusText}`,
      });
    }

    const contentType =
      response.headers.get('content-type') || 'application/octet-stream';

    // 设置 CORS 响应头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('GitHub proxy error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
```

#### 4.4.2 Gitee 代理增强 (Web 端)

更新 `apps/web/api/gitee-proxy.js`，添加 token 支持:

```javascript
// 在现有代码基础上添加 token 处理
const token = req.headers['x-gitee-token'] || req.query.token;

if (token) {
  // 在 Gitee URL 中添加 access_token 参数
  const url = new URL(giteeUrl);
  url.searchParams.set('access_token', token);
  giteeUrl = url.toString();
}
```

### 4.5 Storage Service 修改

#### 4.5.1 GitHub Storage Service

**Web 端** (`apps/web/src/services/githubStorage.ts`):

```typescript
export class GitHubStorageService {
  private config: GitHubConfig;
  private repoInfo: { isPrivate?: boolean } = {};

  // 检测仓库类型
  private async detectRepoType(): Promise<boolean> {
    if (this.repoInfo.isPrivate !== undefined) {
      return this.repoInfo.isPrivate;
    }

    try {
      const repo = await this.makeGitHubRequest(
        `/repos/${this.config.owner}/${this.config.repo}`
      );
      this.repoInfo.isPrivate = repo.private;
      return repo.private;
    } catch (error) {
      console.warn('Failed to detect repo type, assuming public:', error);
      return false; // 默认假设为公开仓库
    }
  }

  // 生成图片 URL
  private async getImageUrl(
    downloadUrl: string,
    filePath: string
  ): Promise<string> {
    const isPrivate = await this.detectRepoType();

    if (!isPrivate) {
      // 公开仓库，直接返回原始 URL
      return downloadUrl;
    }

    // 私有仓库，使用代理
    const isDev = import.meta.env.DEV;
    const useProxy = isDev || import.meta.env.VITE_USE_GITHUB_PROXY === 'true';

    if (useProxy) {
      // 从 download_url 中提取路径
      // 格式: https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}
      const urlMatch = downloadUrl.match(/raw\.githubusercontent\.com\/(.+)$/);
      if (urlMatch) {
        return `/api/github-proxy/${urlMatch[1]}`;
      }
    }

    // 如果无法使用代理，返回原始 URL（可能会失败，但保持向下兼容）
    return downloadUrl;
  }

  async getImageList(): Promise<ImageItem[]> {
    // ... 现有代码 ...

    const images = await Promise.all(
      imageFiles.map(async (item: any) => {
        // ... 现有代码 ...

        const imageUrl = await this.getImageUrl(
          item.download_url || '',
          `${this.config.path}/${item.name}`
        );

        return {
          // ... 现有字段 ...
          url: imageUrl,
          // ... 其他字段 ...
        };
      })
    );

    // ... 现有代码 ...
  }
}
```

**Desktop/Mobile 端**:

对于私有仓库，需要使用 GitHub Contents
API 获取文件内容（base64 编码），然后在前端解码：

```typescript
// 获取图片内容（base64）
private async getImageContent(filePath: string): Promise<string> {
  const response = await this.makeGitHubRequest(
    `/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}?ref=${this.config.branch}`
  );
  return response.content; // base64 编码的内容
}

// 生成图片 URL（对于私有仓库，返回 data URL 或 blob URL）
private async getImageUrl(downloadUrl: string, filePath: string): Promise<string> {
  const isPrivate = await this.detectRepoType();

  if (!isPrivate) {
    return downloadUrl;
  }

  // 私有仓库：获取 base64 内容并转换为 blob URL
  const base64Content = await this.getImageContent(filePath);
  const binaryString = atob(base64Content);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: this.getMimeType(filePath) });
  return URL.createObjectURL(blob);
}
```

#### 4.5.2 Gitee Storage Service

**Web 端** (`apps/web/src/services/giteeStorage.ts`):

```typescript
export class GiteeStorageService {
  private config: GiteeConfig;
  private repoInfo: { isPrivate?: boolean } = {};

  // 检测仓库类型
  private async detectRepoType(): Promise<boolean> {
    if (this.repoInfo.isPrivate !== undefined) {
      return this.repoInfo.isPrivate;
    }

    try {
      const repo = await this.makeGiteeRequest(
        `/repos/${this.config.owner}/${this.config.repo}`
      );
      this.repoInfo.isPrivate = repo.private;
      return repo.private;
    } catch (error) {
      console.warn('Failed to detect repo type, assuming public:', error);
      return false;
    }
  }

  // 生成图片 URL
  private async getRawUrl(
    owner: string,
    repo: string,
    branch: string,
    path: string
  ): Promise<string> {
    const encodedPath = path
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');
    const rawPath = `/${owner}/${repo}/raw/${encodeURIComponent(branch)}/${encodedPath}`;

    const isPrivate = await this.detectRepoType();
    const isDev = import.meta.env.DEV;
    const useProxy = isDev || import.meta.env.VITE_USE_GITEE_PROXY === 'true';

    if (isPrivate && useProxy) {
      // 私有仓库使用代理
      return `/api/gitee-proxy${rawPath}`;
    }

    if (isPrivate) {
      // 私有仓库但不使用代理，在 URL 中添加 token
      return `https://gitee.com${rawPath}?access_token=${encodeURIComponent(this.config.token)}`;
    }

    // 公开仓库
    return `https://gitee.com${rawPath}`;
  }

  async getImageList(): Promise<ImageItem[]> {
    // ... 现有代码，使用 await this.getRawUrl() 替代 this.getRawUrl() ...
  }
}
```

**Desktop/Mobile 端**:

```typescript
private getRawUrl(
  owner: string,
  repo: string,
  branch: string,
  path: string
): string {
  const encodedPath = path
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
  const rawPath = `/${owner}/${repo}/raw/${encodeURIComponent(branch)}/${encodedPath}`;

  // Desktop/Mobile 端：如果是私有仓库，在 URL 中添加 token
  // 注意：需要先检测仓库类型，这里简化处理
  // 实际实现中应该在 getImageList 时检测，然后缓存结果
  if (this.config.isPrivate) {
    return `https://gitee.com${rawPath}?access_token=${encodeURIComponent(this.config.token)}`;
  }

  return `https://gitee.com${rawPath}`;
}
```

## 5. 实现步骤

### 5.1 第一阶段：仓库类型检测

1. 在 Storage Service 中添加 `detectRepoType()` 方法
2. 在初始化或获取图片列表时检测仓库类型
3. 缓存检测结果，避免重复请求

### 5.2 第二阶段：URL 生成策略

1. 修改 `getImageUrl()` 或 `getRawUrl()` 方法
2. 根据仓库类型和平台选择 URL 生成策略
3. 保持公开仓库的 URL 格式不变（向下兼容）

### 5.3 第三阶段：代理服务器

1. 创建 GitHub 代理服务器（Web 端）
2. 增强 Gitee 代理服务器，支持 token
3. 配置 Vercel rewrites（如需要）

### 5.4 第四阶段：Desktop/Mobile 端支持

1. 实现私有仓库的图片获取逻辑
2. 使用 Contents API 或带 token 的 URL
3. 处理 blob URL 的创建和清理

## 6. 向下兼容性保证

### 6.1 公开仓库

- **GitHub**: 继续使用 `download_url`，无需修改
- **Gitee**: 继续使用 raw URL，无需修改

### 6.2 配置兼容

- 不强制要求新增配置项
- `isPrivate` 字段为可选，通过 API 自动检测
- 现有配置格式保持不变

### 6.3 行为兼容

- 公开仓库的访问方式完全不变
- 私有仓库的新行为不影响公开仓库
- 如果检测失败，默认假设为公开仓库（保守策略）

## 7. 安全考虑

### 7.1 Token 安全

- **Web 端**: Token 通过请求头传递给代理服务器，不暴露在 URL 中
- **Desktop/Mobile 端**: Token 可能出现在 URL 中，但仅在本地使用
- **建议**: 使用最小权限的 token（只读权限）

### 7.2 代理服务器安全

- 验证 token 的有效性
- 限制请求频率，防止滥用
- 记录访问日志（可选）

### 7.3 错误处理

- 如果 token 无效，返回明确的错误信息
- 如果仓库类型检测失败，默认假设为公开仓库
- 对于私有仓库访问失败，提供清晰的错误提示

## 8. 测试策略

### 8.1 单元测试

- 测试仓库类型检测逻辑
- 测试 URL 生成策略（公开/私有）
- 测试代理服务器功能

### 8.2 集成测试

- 测试公开仓库的图片访问（确保向下兼容）
- 测试私有仓库的图片访问
- 测试不同平台的实现

### 8.3 兼容性测试

- 验证现有公开仓库配置仍然有效
- 验证新私有仓库配置正常工作
- 验证配置迁移过程

## 9. 配置示例

### 9.1 公开仓库（无需修改）

```json
{
  "owner": "username",
  "repo": "public-repo",
  "branch": "main",
  "token": "ghp_xxxxxxxxxxxx",
  "path": "images"
}
```

### 9.2 私有仓库（自动检测）

```json
{
  "owner": "username",
  "repo": "private-repo",
  "branch": "main",
  "token": "ghp_xxxxxxxxxxxx",
  "path": "images"
}
```

系统会自动检测为私有仓库，并使用相应的访问策略。

## 10. 环境变量

### 10.1 Web 端

```env
# 是否使用 GitHub 代理（默认：开发环境启用，生产环境可选）
VITE_USE_GITHUB_PROXY=true

# 是否使用 Gitee 代理（默认：开发环境启用，生产环境可选）
VITE_USE_GITEE_PROXY=true
```

## 11. 未来优化

1. **Token 刷新机制**: 支持 token 过期自动刷新
2. **缓存优化**: 缓存仓库类型和图片内容
3. **CDN 集成**: 对于公开仓库，考虑使用 CDN 加速
4. **多 token 支持**: 支持为不同仓库配置不同的 token

## 12. 总结

本设计方案通过以下方式实现私有仓库图片访问权限控制：

1. **自动检测**: 自动检测仓库类型，无需用户手动配置
2. **平台适配**: 针对不同平台采用最优方案
3. **向下兼容**: 公开仓库的访问方式完全不变
4. **安全优先**: Token 通过安全方式传递，不暴露在前端

该方案既满足了私有仓库的权限控制需求，又保证了系统的向下兼容性和易用性。
