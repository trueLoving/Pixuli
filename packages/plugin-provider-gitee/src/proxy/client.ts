/** 由 Electron preload 注入（打包版本地代理根 URL） */
declare global {
  interface Window {
    giteeProxyBase?: string;
  }
}

/** 桌面打包版返回主进程代理地址；Web / 桌面 dev 返回 undefined（走同源 /api） */
export function getGiteeProxyBase(isWebBuild = false): string | undefined {
  if (isWebBuild) {
    return undefined;
  }
  const base =
    typeof window !== 'undefined' ? window.giteeProxyBase : undefined;
  return base && base.length > 0 ? base : undefined;
}

/** 供 storageRegistry.create 合并的 Gitee 专用上下文字段 */
export function getGiteeProviderContextFields(isWebBuild = false): {
  giteeProxyBase?: string;
} {
  const base = getGiteeProxyBase(isWebBuild);
  return base ? { giteeProxyBase: base } : {};
}
