/**
 * Desktop 平台 IPC 通信工具
 * 提供与 Electron 主进程通信的封装函数
 */

// IPC Renderer 类型定义
interface IPCRenderer {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  send: (channel: string, ...args: any[]) => void;
  on: (channel: string, listener: (...args: any[]) => void) => void;
  removeListener: (channel: string, listener: (...args: any[]) => void) => void;
}

// Electron API 类型定义
interface ElectronAPI {
  saveFile: (
    fileName: string,
    content: string,
    mimeType: string,
  ) => Promise<void>;
}

/**
 * 获取 IPC Renderer 实例
 */
export function getIpcRenderer(): IPCRenderer | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return (window as any).ipcRenderer || null;
}

/**
 * 检查是否可用 IPC
 */
export function isIpcAvailable(): boolean {
  return getIpcRenderer() !== null;
}

/**
 * 调用 IPC 方法
 */
export async function invokeIpc(channel: string, ...args: any[]): Promise<any> {
  const ipcRenderer = getIpcRenderer();
  if (!ipcRenderer || !ipcRenderer.invoke) {
    throw new Error('IPC Renderer is not available');
  }
  return ipcRenderer.invoke(channel, ...args);
}

/**
 * 发送 IPC 消息
 */
export function sendIpc(channel: string, ...args: any[]): void {
  const ipcRenderer = getIpcRenderer();
  if (ipcRenderer && ipcRenderer.send) {
    ipcRenderer.send(channel, ...args);
  }
}

/**
 * 监听 IPC 消息
 */
export function onIpc(
  channel: string,
  listener: (...args: any[]) => void,
): void {
  const ipcRenderer = getIpcRenderer();
  if (ipcRenderer && ipcRenderer.on) {
    ipcRenderer.on(channel, listener);
  }
}

/**
 * 移除 IPC 监听器
 */
export function removeIpcListener(
  channel: string,
  listener: (...args: any[]) => void,
): void {
  const ipcRenderer = getIpcRenderer();
  if (ipcRenderer && ipcRenderer.removeListener) {
    ipcRenderer.removeListener(channel, listener);
  }
}

/**
 * 获取 Electron API 实例
 */
export function getElectronAPI(): ElectronAPI | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return (window as any).electronAPI || null;
}

/**
 * 检查 Electron API 是否可用
 */
export function isElectronAPIAvailable(): boolean {
  return getElectronAPI() !== null;
}

/**
 * 保存文件（Desktop 特定）
 */
export async function saveFile(
  fileName: string,
  content: string,
  mimeType: string,
): Promise<void> {
  const electronAPI = getElectronAPI();
  if (!electronAPI || !electronAPI.saveFile) {
    throw new Error('Electron API is not available');
  }
  return electronAPI.saveFile(fileName, content, mimeType);
}

/**
 * 关闭窗口
 * 注意：压缩、转换、AI 分析窗口已移除，此函数保留用于后续扩展
 * @deprecated 此函数已不再使用，保留用于后续扩展
 */
export async function closeWindow(
  windowType: 'compression' | 'conversion' | 'ai-analysis',
): Promise<void> {
  // 这些窗口类型已移除，保留函数签名用于后续扩展
  console.warn(
    `Window type "${windowType}" has been removed. This function is deprecated.`,
  );
}

/**
 * 打开项目窗口
 */
export async function openProjectWindow(projectId: string): Promise<void> {
  await invokeIpc('open-win', `project?id=${encodeURIComponent(projectId)}`);
}
