// Vercel Serverless Function — 逻辑由 @pixuli/provider-gitee 提供（REF-313）
import { handleGiteeImageProxy } from '@pixuli/provider-gitee/proxy/server';

export default async function handler(req, res) {
  await handleGiteeImageProxy(req, res);
}
