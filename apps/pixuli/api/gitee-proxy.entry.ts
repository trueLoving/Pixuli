/**
 * Vercel Serverless 打包入口（REF-410）。
 * 由 `pnpm build:vercel-api` 经 esbuild 打成 `gitee-proxy.js`；勿直接编辑产物。
 */
import { handleGiteeImageProxy } from '@pixuli/provider-gitee/proxy/server';

export default async function handler(
  req: import('node:http').IncomingMessage,
  res: import('node:http').ServerResponse,
): Promise<void> {
  await handleGiteeImageProxy(req, res);
}
