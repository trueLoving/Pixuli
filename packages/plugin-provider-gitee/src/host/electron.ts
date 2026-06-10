import type {
  ElectronMainHostContext,
  ElectronPreloadHostContext,
} from '@pixuli/core/plugins';
import { startGiteeProxyServer } from '../proxy/giteeProxyServer';

export const GITEE_PROXY_IPC_CHANNEL = 'gitee:proxy-base';

let giteeProxyBaseUrl = '';

/**
 * Electron 主进程：打包版启动本地 Gitee 代理；dev 走 Vite 中间件。
 * REF-411 hostIntegrations `electronMain` 入口。
 */
export async function setupGiteeElectronMainHost(
  ctx: ElectronMainHostContext,
): Promise<void> {
  ctx.ipcMain.on(GITEE_PROXY_IPC_CHANNEL, event => {
    event.returnValue = giteeProxyBaseUrl;
  });

  if (ctx.isDev) {
    return;
  }

  const proxy = await startGiteeProxyServer();
  giteeProxyBaseUrl = proxy.baseUrl;
  ctx.onBeforeQuit(() => proxy.close());
}

/**
 * Electron preload：向 Renderer 暴露 `window.giteeProxyBase`。
 * REF-411 hostIntegrations `electronPreload` 入口。
 */
export function exposeGiteeElectronPreload(
  ctx: ElectronPreloadHostContext,
): void {
  const giteeProxyBase = ctx.ipcRenderer.sendSync(GITEE_PROXY_IPC_CHANNEL);
  ctx.contextBridge.exposeInMainWorld(
    'giteeProxyBase',
    typeof giteeProxyBase === 'string' ? giteeProxyBase : '',
  );
}
