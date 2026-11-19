import { app, type BrowserWindow } from 'electron';
import path from 'node:path';

export const PIXULI_PROTOCOL = 'pixuli';

let pendingDeepLink: string | null = null;
let mainWindowRef: BrowserWindow | null = null;

export function setDeepLinkMainWindow(win: BrowserWindow | null): void {
  mainWindowRef = win;
  if (win && pendingDeepLink) {
    deliverDeepLink(pendingDeepLink);
    pendingDeepLink = null;
  }
}

export function registerPixuliProtocolClient(): void {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(PIXULI_PROTOCOL, process.execPath, [
        path.resolve(process.argv[1]),
      ]);
      return;
    }
  }
  app.setAsDefaultProtocolClient(PIXULI_PROTOCOL);
}

export function extractDeepLinkFromArgv(argv: string[]): string | null {
  return argv.find(arg => arg.startsWith(`${PIXULI_PROTOCOL}://`)) ?? null;
}

export function deliverDeepLink(url: string): void {
  if (!url.startsWith(`${PIXULI_PROTOCOL}://`)) return;
  const win = mainWindowRef;
  if (!win || win.isDestroyed()) {
    pendingDeepLink = url;
    return;
  }
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
  win.webContents.send('pixuli:deep-link', url);
}

export function takePendingDeepLink(): string | null {
  const url = pendingDeepLink;
  pendingDeepLink = null;
  return url;
}

export function peekPendingDeepLink(): string | null {
  return pendingDeepLink;
}
