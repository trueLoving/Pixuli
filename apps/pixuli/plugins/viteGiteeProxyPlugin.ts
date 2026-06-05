import type { Plugin } from 'vite';
import { createGiteeProxyMiddleware } from '@pixuli/provider-gitee/proxy/server';

/**
 * Web / 桌面 dev：Vite 配置专用入口（由 esbuild 打包，避免 Node 原生 ESM 解析 .ts 子路径）。
 */
export function viteGiteeProxyPlugin(): Plugin {
  return {
    name: 'pixuli-gitee-image-proxy',
    configureServer(server) {
      server.middlewares.use(createGiteeProxyMiddleware());
    },
  };
}
