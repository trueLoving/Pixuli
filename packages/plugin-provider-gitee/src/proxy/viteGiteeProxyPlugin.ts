import type { Plugin } from 'vite';

import type { Plugin } from 'vite';

/**
 * Web / 桌面 dev：服务端跟随 Gitee CDN 重定向（REF-313）。
 * 经 ssrLoadModule 加载（Host 须配置 ssr.noExternal）。
 */
export function viteGiteeProxyPlugin(): Plugin {
  return {
    name: 'pixuli-gitee-image-proxy',
    async configureServer(server) {
      const { createGiteeProxyMiddleware } = await server.ssrLoadModule(
        '@pixuli/provider-gitee/proxy/server',
      );
      server.middlewares.use(createGiteeProxyMiddleware());
    },
  };
}
