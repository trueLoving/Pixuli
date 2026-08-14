import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  './packages/core/vitest.config.ts',
  './packages/plugin-provider-github/vitest.config.ts',
  './packages/plugin-provider-gitee/vitest.config.ts',
  // app - jsdom 环境（含内联 UI）
  './app/vitest.config.ts',
  // 根目录测试 - node 环境（如果有）
  './vitest.config.ts',
]);
