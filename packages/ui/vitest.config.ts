import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()] as never[],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@pixuli/ui/locales': path.resolve(__dirname, './src/locales/index.ts'),
      '@pixuli/ui/feedback/toast': path.resolve(
        __dirname,
        './src/feedback/toast.ts',
      ),
      '@pixuli/ui/utils/keyboardShortcuts': path.resolve(
        __dirname,
        './src/utils/keyboardShortcuts.ts',
      ),
      '@pixuli/core/types': path.resolve(
        __dirname,
        '../core/src/types/index.ts',
      ),
      '@pixuli/core/utils': path.resolve(
        __dirname,
        '../core/src/utils/index.ts',
      ),
    },
  },
});
