import type { Plugin } from 'vite';

/**
 * Web / 桌面 dev：Gitee 图片代理。动态 import provider，避免 `vite build` 时 Node 原生 ESM
 * 解析 workspace 包内无扩展名相对路径（Vercel 等 CI 会加载 vite.config.ts）。
 */
export function viteGiteeProxyPlugin(): Plugin {
  return {
    name: 'pixuli-gitee-image-proxy',
    async configureServer(server) {
      const { createGiteeProxyMiddleware } = await import(
        '@pixuli/provider-gitee/proxy/server'
      );
      server.middlewares.use(createGiteeProxyMiddleware());
    },
  };
}
