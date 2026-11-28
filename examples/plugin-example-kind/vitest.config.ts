import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@pixuli/example-kind-plugin',
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
  },
});
