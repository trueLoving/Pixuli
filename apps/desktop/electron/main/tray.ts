import { BrowserWindow, Menu, nativeImage, Tray } from 'electron';
import path from 'node:path';

let tray: Tray | null = null;
let compressionWindow: BrowserWindow | null = null;
let conversionWindow: BrowserWindow | null = null;

let onQuit: (() => void) | null = null;

const preload = path.join(__dirname, '../preload/index.js');
const indexHtml = path.join(__dirname, '../../dist/index.html');
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

/**
 * 创建系统托盘
 * @param win 主窗口引用
 * @param onQuitCallback 退出回调函数
 */
export function createTray(
  win: BrowserWindow | null,
  onQuitCallback?: () => void
) {
  if (tray) {
    return; // 如果托盘已存在，则不再创建
  }

  onQuit = onQuitCallback || null;

  // 尝试多个可能的图标路径
  const iconPath = path.join(__dirname, '../../public/icon.png');
  let icon = nativeImage.createFromPath(iconPath);

  // macOS 需要设置为模板图像（单色），在调整大小之前设置
  if (process.platform === 'darwin') {
    icon.setTemplateImage(true);
  }

  // 调整图标大小
  let trayIcon = icon.resize({ width: 28, height: 28 });

  // 创建托盘
  tray = new Tray(trayIcon);

  // 设置托盘提示
  tray.setToolTip('Pixuli - 智能图片管理工具');

  // 创建上下文菜单
  updateTrayMenu(win);

  // 右键点击托盘图标显示菜单
  tray.on('right-click', () => {
    tray?.popUpContextMenu();
  });
}

/**
 * 打开图片压缩窗口
 */
function openCompressionWindow() {
  // 如果窗口已存在且显示，则聚焦
  if (compressionWindow && !compressionWindow.isDestroyed()) {
    compressionWindow.show();
    compressionWindow.focus();
    return;
  }

  // 创建新窗口
  compressionWindow = new BrowserWindow({
    title: '图片压缩',
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  // 加载压缩窗口内容
  if (VITE_DEV_SERVER_URL) {
    // 开发模式：加载 dev server 并传递 hash
    compressionWindow.loadURL(`${VITE_DEV_SERVER_URL}#compression`);
  } else {
    // 生产模式：加载本地文件
    compressionWindow.loadFile(indexHtml, { hash: 'compression' });
  }

  // 窗口关闭时清理引用
  compressionWindow.on('closed', () => {
    compressionWindow = null;
  });

  // 开发模式下打开调试工具
  if (VITE_DEV_SERVER_URL) {
    compressionWindow.webContents.openDevTools();
  }
}

/**
 * 打开图片转换窗口
 */
function openConversionWindow() {
  // 如果窗口已存在且显示，则聚焦
  if (conversionWindow && !conversionWindow.isDestroyed()) {
    conversionWindow.show();
    conversionWindow.focus();
    return;
  }

  // 创建新窗口
  conversionWindow = new BrowserWindow({
    title: '图片转换',
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  // 加载转换窗口内容
  if (VITE_DEV_SERVER_URL) {
    // 开发模式：加载 dev server 并传递 hash
    conversionWindow.loadURL(`${VITE_DEV_SERVER_URL}#conversion`);
  } else {
    // 生产模式：加载本地文件
    conversionWindow.loadFile(indexHtml, { hash: 'conversion' });
  }

  // 窗口关闭时清理引用
  conversionWindow.on('closed', () => {
    conversionWindow = null;
  });

  // 开发模式下打开调试工具
  if (VITE_DEV_SERVER_URL) {
    conversionWindow.webContents.openDevTools();
  }
}

/**
 * 更新系统托盘菜单
 * @param win 主窗口引用
 */
export function updateTrayMenu(win: BrowserWindow | null) {
  if (!tray) {
    return;
  }

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '图片压缩',
      click: () => {
        openCompressionWindow();
      },
    },
    {
      label: '图片转换',
      click: () => {
        openConversionWindow();
      },
    },
    { type: 'separator' },
  ];

  const contextMenu = Menu.buildFromTemplate(template);
  tray.setContextMenu(contextMenu);
}

/**
 * 关闭压缩窗口
 */
export function closeCompressionWindow() {
  if (compressionWindow && !compressionWindow.isDestroyed()) {
    compressionWindow.close();
    compressionWindow = null;
  }
}

/**
 * 关闭转换窗口
 */
export function closeConversionWindow() {
  if (conversionWindow && !conversionWindow.isDestroyed()) {
    conversionWindow.close();
    conversionWindow = null;
  }
}

/**
 * 销毁系统托盘
 */
export function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
  // 同时关闭所有窗口
  if (compressionWindow && !compressionWindow.isDestroyed()) {
    compressionWindow.close();
    compressionWindow = null;
  }
  if (conversionWindow && !conversionWindow.isDestroyed()) {
    conversionWindow.close();
    conversionWindow = null;
  }
}
