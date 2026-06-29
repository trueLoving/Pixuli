import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    register: 'src/register.ts',
    manifest: 'src/manifest.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  external: ['@pixuli/core', '@pixuli/core/plugins'],
});
