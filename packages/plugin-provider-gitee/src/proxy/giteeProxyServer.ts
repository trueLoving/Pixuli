import http from 'node:http';
import { GITEE_PROXY_PATH } from '@pixuli/provider-gitee/proxy/constants';
import { handleGiteeImageProxy } from '@pixuli/provider-gitee/proxy/server';

/**
 * 桌面打包版本地 Gitee 图片代理（REF-313）
 * file:// 页面无法使用相对路径，由主进程在 127.0.0.1 起 HTTP 服务。
 */
export function startGiteeProxyServer(): Promise<{
  baseUrl: string;
  close: () => void;
}> {
  const server = http.createServer((req, res) => {
    if (!req.url?.startsWith(GITEE_PROXY_PATH)) {
      res.statusCode = 404;
      res.end();
      return;
    }

    handleGiteeImageProxy(req, res).catch((err: unknown) => {
      console.error('[gitee-proxy]', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port =
        typeof addr === 'object' && addr && 'port' in addr ? addr.port : 0;
      resolve({
        baseUrl: `http://127.0.0.1:${port}`,
        close: () => server.close(),
      });
    });
  });
}
