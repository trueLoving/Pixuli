import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // 为需要浏览器环境的测试文件配置 jsdom
    environmentMatchGlobs: [
      ['**/packages/ui/**/*.{test,spec}.{js,ts,tsx}', 'jsdom'],
      ['**/apps/web/**/*.{test,spec}.{js,ts,tsx}', 'jsdom'],
      ['**/apps/desktop/**/*.{test,spec}.{js,ts,tsx}', 'jsdom'],
    ],
    exclude: [
      '**/server/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/coverage/**',
      '**/playwright/**',
      '**/e2e/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/*.config.{js,ts}',
        '**/*.d.ts',
        '**/coverage/**',
        '**/playwright/**',
        '**/e2e/**',
        '**/*.test.{js,ts,tsx}',
        '**/*.spec.{js,ts,tsx}',
      ],
    },
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@packages': path.resolve(__dirname, './packages'),
      '@apps': path.resolve(__dirname, './apps'),
    },
  },
});
