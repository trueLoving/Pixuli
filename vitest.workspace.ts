import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  './packages/core/vitest.config.ts',
  './packages/plugin-provider-github/vitest.config.ts',
  './packages/plugin-provider-gitee/vitest.config.ts',
  './packages/ui/vitest.config.ts',
  // apps/pixuli - jsdom 环境
  './apps/pixuli/vitest.config.ts',
  // apps/mobile - node 环境
  './apps/mobile/vitest.config.ts',
  // 根目录测试 - node 环境（如果有）
  './vitest.config.ts',
]);
