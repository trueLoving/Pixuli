import type { Plugin } from 'vite';

/**
 * Web / 桌面 dev：Gitee 图片代理。经 ssrLoadModule 加载（须 vite.config ssr.noExternal
 * 含 @pixuli/provider-gitee）；插件本身无静态 import provider。
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
