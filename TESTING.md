# 🧪 测试体系说明

本文档说明 Pixuli 项目的测试体系配置和使用方法。

## 📋 测试框架

### 单元测试和组件测试

- **Vitest**: 快速、现代化的测试框架，与 Vite 完美集成
- **Testing Library**: React 和 React Native 组件测试工具
- **jsdom**: DOM 环境模拟（用于 Web 组件测试）

### E2E 测试

- **Playwright**: 跨浏览器端到端测试框架

## 🏗️ 测试结构

```
Pixuli/
├── vitest.config.ts          # 根目录 Vitest 配置
├── vitest.setup.ts            # 全局测试设置
├── playwright.config.ts       # Playwright E2E 测试配置
├── e2e/                       # E2E 测试目录
│   └── example.spec.ts
├── packages/
│   ├── ui/
│   │   ├── vitest.config.ts
│   │   ├── vitest.setup.ts
│   │   └── src/__tests__/    # UI 组件测试
│   └── wasm/
│       ├── vitest.config.ts
│       └── src/__tests__/    # WASM 模块测试
└── apps/
    ├── web/
    │   ├── vitest.config.ts
    │   ├── vitest.setup.ts
    │   └── src/__tests__/    # Web 应用测试
    ├── desktop/
    │   ├── vitest.config.ts
    │   ├── vitest.setup.ts
    │   └── src/__tests__/    # Desktop 应用测试
    └── mobile/
        ├── vitest.config.ts
        ├── vitest.setup.ts
        └── __tests__/        # Mobile 应用测试
```

## 🚀 使用方法

### 安装依赖

```bash
# 在根目录安装所有测试依赖
pnpm install
```

### 运行测试

#### 根目录（运行所有测试）

```bash
# 运行所有单元测试
pnpm test

# 监听模式运行测试
pnpm test:watch

# 使用 UI 界面运行测试
pnpm test:ui

# 生成测试覆盖率报告
pnpm test:coverage

# 运行 E2E 测试
pnpm test:e2e

# 使用 UI 界面运行 E2E 测试
pnpm test:e2e:ui

# 运行所有测试（单元测试 + E2E）
pnpm test:all
```

#### 子项目测试

```bash
# 测试 UI 组件库
pnpm run --filter pixuli-ui test

# 测试 WASM 模块
pnpm run --filter pixuli-wasm test

# 测试 Web 应用
pnpm run --filter pixuli-web test

# 测试 Desktop 应用
pnpm run --filter pixuli-desktop test

# 测试 Mobile 应用
pnpm run --filter pixuli-mobile test
```

## 📝 编写测试

### React 组件测试示例

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImageBrowser } from './ImageBrowser';

describe('ImageBrowser', () => {
  it('should render empty state', () => {
    render(<ImageBrowser images={[]} />);
    expect(screen.getByText('No images')).toBeInTheDocument();
  });

  it('should render images', () => {
    const images = [
      { id: '1', name: 'test.jpg', url: 'https://example.com/test.jpg' },
    ];
    render(<ImageBrowser images={images} />);
    expect(screen.getByText('test.jpg')).toBeInTheDocument();
  });
});
```

### React Native 组件测试示例

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react-native';
import { ImageGrid } from './ImageGrid';

describe('ImageGrid', () => {
  it('should render images', () => {
    const images = [{ id: '1', uri: 'https://example.com/test.jpg' }];
    render(<ImageGrid images={images} />);
    expect(screen.getByTestId('image-1')).toBeOnTheScreen();
  });
});
```

### 状态管理测试示例

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImageStore } from './imageStore';

describe('useImageStore', () => {
  it('should initialize with empty images', () => {
    const { result } = renderHook(() => useImageStore());
    expect(result.current.images).toEqual([]);
  });

  it('should add image', () => {
    const { result } = renderHook(() => useImageStore());
    act(() => {
      result.current.addImage({ id: '1', name: 'test.jpg' });
    });
    expect(result.current.images).toHaveLength(1);
  });
});
```

### E2E 测试示例

```typescript
import { test, expect } from '@playwright/test';

test.describe('Pixuli Web', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Pixuli/i);
  });

  test('should upload image', async ({ page }) => {
    await page.goto('/');
    // 测试上传功能
  });
});
```

## 📊 测试覆盖率

测试覆盖率目标：

- **总体覆盖率**: ≥ 60%
- **核心功能**: ≥ 80%
- **工具函数**: ≥ 90%

查看覆盖率报告：

```bash
pnpm test:coverage
# 打开 coverage/index.html 查看详细报告
```

## 🔧 配置说明

### Vitest 配置

每个子项目都有自己的 `vitest.config.ts`，可以根据需要自定义：

- **环境**: `jsdom`（Web/Desktop）或 `node`（WASM/Mobile）
- **路径别名**: 支持 `@` 和 `@packages` 别名
- **测试文件**: 匹配 `**/*.{test,spec}.{js,ts,tsx}`

### Playwright 配置

- **浏览器**: Chromium, Firefox, WebKit
- **移动端**: Mobile Chrome, Mobile Safari
- **自动启动**: 开发服务器自动启动（Web 应用）

## 📚 最佳实践

1. **测试命名**: 使用描述性的测试名称
2. **测试隔离**: 每个测试应该独立，不依赖其他测试
3. **Mock 数据**: 使用模拟数据而不是真实 API
4. **覆盖率**: 优先测试核心功能和边界情况
5. **E2E 测试**: 只测试关键用户流程

## 🐛 故障排除

### 测试无法找到模块

检查路径别名配置是否正确，确保 `vitest.config.ts` 中的 `resolve.alias`
配置正确。

### jsdom 环境问题

如果遇到 DOM API 相关问题，确保 `vitest.config.ts` 中设置了
`environment: 'jsdom'`。

### Playwright 浏览器下载失败

```bash
# 手动安装浏览器
pnpm exec playwright install
```

## 📖 参考资源

- [Vitest 文档](https://vitest.dev/)
- [Testing Library 文档](https://testing-library.com/)
- [Playwright 文档](https://playwright.dev/)

---

**最后更新**: 2024年
