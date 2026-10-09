import path from 'path';
import { defineConfig } from 'vitest/config';

/** 性能基准测试单独配置，不进入默认 `pnpm test`。 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['benchmark/**/*.bench.ts'],
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../app/src'),
    },
  },
});
