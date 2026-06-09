// Vercel Serverless Function — 逻辑由 @pixuli/provider-gitee 提供（REF-313 / REF-410）
// 入口须为 .js：当前 Vercel 部署不识别 api/*.ts，见 05-TypeScript-JavaScript-Policy.md §2.2
import { handleGiteeImageProxy } from '@pixuli/provider-gitee/proxy/server';

export default async function handler(req, res) {
  await handleGiteeImageProxy(req, res);
}
