import { app, BrowserWindow, ipcMain, shell, session } from 'electron';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setApp } from './app';
import { registerServiceHandlers } from './services';
import {
  createTray,
  updateTrayMenu,
  destroyTray,
  closeCompressionWindow,
  // closeConversionWindow,
} from './tray';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 获取版本信息
const packageJson = require('../../package.json');
const APP_VERSION = packageJson.version;
const APP_NAME = packageJson.productName || packageJson.name;

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..');

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win: BrowserWindow | null = null;
let appIsQuitting = false;
const preload = path.join(__dirname, '../preload/index.js');
const indexHtml = path.join(RENDERER_DIST, 'index.html');

/**
 * 设置 Content Security Policy
 * 为所有窗口统一设置 CSP，提高安全性
 */
function setupContentSecurityPolicy() {
  const defaultSession = session.defaultSession;
  const isDev = !!VITE_DEV_SERVER_URL;

  // 开发模式的 CSP（允许 Vite dev server 和 HMR）
  // 注意：'unsafe-eval' 只在开发模式下需要，用于 Vite HMR
  const devCSP =
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https: http://localhost:*; " +
    "font-src 'self' data:; " +
    "connect-src 'self' http://localhost:* ws://localhost:* wss://* https://*; " +
    "frame-src 'self'; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';";

  // 生产模式的 CSP（更严格，移除 unsafe-eval）
  const prodCSP =
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https:; " +
    "frame-src 'self'; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';";

  const csp = isDev ? devCSP : prodCSP;

  // 为所有请求设置 CSP
  defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    });
  });
}

async function createWindow() {
  win = new BrowserWindow({
    title: `${APP_NAME} - 智能图片管理工具 v${APP_VERSION}`,
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      sandbox: false, // Preload script needs access to Node.js APIs
    },
  });

  // 设置应用工具栏
  setApp(win, APP_NAME, APP_VERSION);

  if (VITE_DEV_SERVER_URL) {
    // #298
    win.loadURL(VITE_DEV_SERVER_URL);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  // 创建系统托盘，传入退出回调
  // createTray(win, () => {
  //   appIsQuitting = true;
  // });

  // 监听窗口显示/隐藏，更新托盘菜单
  win.on('show', () => {
    // updateTrayMenu(win);
  });

  win.on('hide', () => {
    // updateTrayMenu(win);
  });

  // 监听窗口关闭事件，阻止默认行为并隐藏到托盘
  win.on('close', event => {
    if (!appIsQuitting) {
      event.preventDefault();
      win?.hide();
    }
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  // 在应用准备就绪后设置 CSP
  setupContentSecurityPolicy();
  createWindow();
});

app.on('window-all-closed', () => {
  // macOS 上即使所有窗口都关闭，应用也继续运行
  if (process.platform !== 'darwin') {
    win = null;
    app.quit();
  } else {
    // macOS 上保持窗口引用但不退出
    if (win) {
      win.hide();
    }
  }
});

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  }
});

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// 应用退出前清理托盘
app.on('before-quit', () => {
  // destroyTray();
});

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});

// 注册服务处理程序
registerServiceHandlers();

// 处理关闭压缩窗口的 IPC 请求
ipcMain.handle('close-compression-window', () => {
  // closeCompressionWindow();
});

// 处理关闭转换窗口的 IPC 请求
ipcMain.handle('close-conversion-window', () => {
  // closeConversionWindow();
});
