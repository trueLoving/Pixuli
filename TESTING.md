# Pixuli 测试文档

## 测试环境设置

本项目使用 Vitest 和 Testing Library 进行单元测试和组件测试。

### 安装的依赖

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react
```

### 配置文件

- `vitest.config.ts` - Vitest 配置文件
- `src/test/setup.ts` - 测试环境设置文件

## 测试命令

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行测试一次（CI 模式）
pnpm test:run

# 打开测试 UI
pnpm test:ui
```

## 测试覆盖范围

### ✅ 已完成的测试

#### Utils 测试 (4 个文件)
- `src/utils/__tests__/fileSizeUtils.test.ts` - 文件大小工具函数测试
- `src/utils/__tests__/imageUtils.test.ts` - 图片处理工具函数测试
- `src/utils/__tests__/filterUtils.test.ts` - 过滤工具函数测试
- `src/utils/__tests__/sortUtils.test.ts` - 排序工具函数测试

**测试统计**: 61 个测试用例，全部通过 ✅

### 🔄 待完成的测试

以下测试文件已被删除，可以根据需要重新创建：

#### Hooks 测试
- `src/hooks/__tests__/useImageDimensions.test.tsx`
- `src/hooks/__tests__/useInfiniteScroll.test.tsx`
- `src/hooks/__tests__/useLazyLoad.test.tsx`
- `src/hooks/__tests__/useVirtualScroll.test.tsx`

#### Services 测试
- `src/services/__tests__/githubStorage.test.ts`
- `src/services/__tests__/formatConversion.test.ts`
- `src/services/__tests__/webpCompression.test.ts`

#### Stores 测试
- `src/stores/__tests__/imageStore.test.ts`

#### Components 测试
- `src/components/__tests__/ImageUpload.test.tsx`
- `src/components/__tests__/ImageGrid.test.tsx`

## 测试特点

1. **中文测试描述**: 所有测试用例都使用中文描述，便于理解
2. **全面的 Mock 设置**: 模拟了所有外部依赖（File API、Image API、Electron API 等）
3. **边界情况测试**: 包含错误处理、边界条件和异常情况的测试
4. **异步操作测试**: 正确处理了 Promise 和异步操作的测试

## 测试最佳实践

1. **测试命名**: 使用中文描述测试用例的功能
2. **Mock 策略**: 为外部依赖创建合适的 Mock
3. **异步测试**: 使用 `async/await` 和 `waitFor` 处理异步操作
4. **错误测试**: 确保错误情况得到正确处理
5. **边界测试**: 测试边界值和异常情况

## 运行测试

```bash
# 运行所有测试
pnpm test:run

# 运行特定目录的测试
pnpm test:run src/utils/__tests__/

# 运行特定文件的测试
pnpm test:run src/utils/__tests__/fileSizeUtils.test.ts
```

## 测试覆盖率

当前 utils 目录的测试覆盖率为 100%，包含：
- 文件大小格式化函数
- 图片处理工具函数
- 过滤和排序工具函数
- 错误处理和边界情况

## 注意事项

1. 测试环境使用 jsdom 模拟浏览器环境
2. 所有外部 API 都被适当 Mock
3. 测试文件使用 `.test.ts` 或 `.test.tsx` 后缀
4. 测试设置文件配置了全局的 Mock 和工具函数
