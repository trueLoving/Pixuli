import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  // packages/common - 需要 jsdom 环境
  './packages/common/vitest.config.ts',
  // packages/wasm - node 环境
  './packages/wasm/vitest.config.ts',
  // apps/web - jsdom 环境
  './apps/web/vitest.config.ts',
  // apps/desktop - jsdom 环境
  './apps/desktop/vitest.config.ts',
  // apps/mobile - node 环境
  './apps/mobile/vitest.config.ts',
  // 根目录测试 - node 环境（如果有）
  './vitest.config.ts',
]);
