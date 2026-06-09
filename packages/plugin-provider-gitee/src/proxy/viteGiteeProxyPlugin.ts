import type { Plugin } from 'vite';

/**
 * Web / 桌面 dev：服务端跟随 Gitee CDN 重定向（REF-313）。
 * 动态 import 避免 vite build 时 Node 原生 ESM 解析无扩展名相对路径。
 */
export function viteGiteeProxyPlugin(): Plugin {
  return {
    name: 'pixuli-gitee-image-proxy',
    async configureServer(server) {
      const { createGiteeProxyMiddleware } = await import('./giteeImageProxy');
      server.middlewares.use(createGiteeProxyMiddleware());
    },
  };
}
