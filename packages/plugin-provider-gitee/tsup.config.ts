import { cpSync } from 'node:fs';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    register: 'src/register.ts',
    manifest: 'src/manifest.ts',
    'host/electron': 'src/host/electron.ts',
    'proxy/index': 'src/proxy/index.ts',
    'proxy/client': 'src/proxy/client.ts',
    'proxy/url': 'src/proxy/url.ts',
    'proxy/node': 'src/proxy/giteeProxyServer.ts',
    'proxy/vite': 'src/proxy/viteGiteeProxyPlugin.ts',
    'proxy/server': 'src/proxy/giteeImageProxy.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  external: ['@pixuli/core', '@pixuli/core/plugins', 'vite'],
  onSuccess: async () => {
    cpSync('src/proxy/constants.js', 'dist/proxy/constants.js');
  },
});
