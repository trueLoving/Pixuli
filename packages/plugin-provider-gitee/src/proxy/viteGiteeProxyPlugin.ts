import type { Plugin } from 'vite';

import { createGiteeProxyMiddleware } from './giteeImageProxy';

/**
 * Web / 桌面 dev：服务端跟随 Gitee CDN 重定向（REF-313 / REF-411）。
 * 中间件逻辑内联进 dist，避免 ssrLoadModule 二次解析子路径。
 */
export function viteGiteeProxyPlugin(): Plugin {
  return {
    name: 'pixuli-gitee-image-proxy',
    configureServer(server) {
      server.middlewares.use(createGiteeProxyMiddleware());
    },
  };
}
