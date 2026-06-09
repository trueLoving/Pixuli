// Vercel Serverless Function — 逻辑由 @pixuli/provider-gitee 提供（REF-313 / REF-410）
import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleGiteeImageProxy } from '@pixuli/provider-gitee/proxy/server';

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  await handleGiteeImageProxy(req, res);
}
