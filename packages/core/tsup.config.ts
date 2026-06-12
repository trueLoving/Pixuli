import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'types/index': 'src/types/index.ts',
    'plugins/index': 'src/plugins/index.ts',
    'plugins/host': 'src/plugins/hostIntegration.ts',
    'plugins/registry': 'src/plugins/registry.ts',
    'platform/index': 'src/platform/index.ts',
    'utils/index': 'src/utils/index.ts',
    'locales/index': 'src/locales/index.ts',
    'operation-log/index': 'src/operation-log/index.ts',
    'sources/index': 'src/sources/index.ts',
    'vault/index': 'src/vault/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
});
