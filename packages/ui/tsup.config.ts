import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  external: ['react', 'react-dom'],
  noExternal: [
    'lucide-react',
    'react-hot-toast',
    'react-dropzone',
    'react-image-crop',
    'zustand',
  ],
  esbuildOptions(options) {
    options.loader = {
      ...options.loader,
      '.css': 'text',
    };
  },
});
