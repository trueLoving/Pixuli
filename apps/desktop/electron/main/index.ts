import { app, BrowserWindow, ipcMain, shell } from 'electron';
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
  closeConversionWindow,
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
  createTray(win, () => {
    appIsQuitting = true;
  });

  // 监听窗口显示/隐藏，更新托盘菜单
  win.on('show', () => {
    updateTrayMenu(win);
  });

  win.on('hide', () => {
    updateTrayMenu(win);
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

app.whenReady().then(createWindow);

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
  destroyTray();
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
  closeCompressionWindow();
});

// 处理关闭转换窗口的 IPC 请求
ipcMain.handle('close-conversion-window', () => {
  closeConversionWindow();
});
