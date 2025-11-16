import { BrowserWindow, Menu, nativeImage, Tray } from 'electron';
import path from 'node:path';

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;
let compressionWindow: BrowserWindow | null = null;
let conversionWindow: BrowserWindow | null = null;
let aiAnalysisWindow: BrowserWindow | null = null;

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

  mainWindow = win;
  onQuit = onQuitCallback || null;

  // 尝试多个可能的图标路径
  const iconPaths = [
    path.join(__dirname, '../../public/icon.png'),
    path.join(__dirname, '../../dist/icon.png'),
    path.join(process.env.VITE_PUBLIC || '', 'icon.png'),
  ];

  let icon: Electron.NativeImage | null = null;
  for (const iconPath of iconPaths) {
    try {
      icon = nativeImage.createFromPath(iconPath);
      if (!icon.isEmpty()) {
        break;
      }
    } catch (error) {
      // 继续尝试下一个路径
    }
  }

  // 如果所有路径都失败，创建一个默认图标
  if (!icon || icon.isEmpty()) {
    icon = nativeImage.createEmpty();
  }

  // macOS 需要设置为模板图像（单色），在调整大小之前设置
  if (process.platform === 'darwin') {
    icon.setTemplateImage(true);
  }

  // 根据平台调整图标大小
  const iconSize =
    process.platform === 'darwin' ? 22 : process.platform === 'win32' ? 32 : 24;
  let trayIcon = icon.resize({ width: iconSize, height: iconSize });

  // 创建托盘
  tray = new Tray(trayIcon);

  // 设置托盘提示
  tray.setToolTip('Pixuli - 智能图片管理工具');

  // 创建上下文菜单
  updateTrayMenu(win);

  // 所有平台统一行为：右键点击显示菜单
  // macOS: 左键点击也会显示菜单（系统默认行为）
  // Windows/Linux: 右键点击显示菜单
  if (process.platform === 'darwin') {
    // macOS: 左键点击显示菜单（系统默认行为）
    tray.on('click', () => {
      tray?.popUpContextMenu();
    });
  } else {
    // Windows 和 Linux: 右键点击显示菜单
    tray.on('right-click', () => {
      tray?.popUpContextMenu();
    });
    // Windows/Linux: 左键点击不执行任何操作
    // 用户可以双击托盘图标区域来显示菜单（如果需要）
  }
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
    title: '图片压缩 - Pixuli',
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

  // 页面加载完成后确保标题正确显示
  compressionWindow.webContents.on('did-finish-load', () => {
    compressionWindow?.setTitle('图片压缩 - Pixuli');
  });

  // 窗口关闭时清理引用
  compressionWindow.on('closed', () => {
    compressionWindow = null;
  });

  // DevTools 可以通过快捷键手动打开（Cmd+Option+I 或 Ctrl+Shift+I）
  // if (VITE_DEV_SERVER_URL) {
  //   compressionWindow.webContents.openDevTools();
  // }
}

/**
 * 打开 AI 分析窗口
 */
function openAIAnalysisWindow() {
  // 如果窗口已存在且显示，则聚焦
  if (aiAnalysisWindow && !aiAnalysisWindow.isDestroyed()) {
    aiAnalysisWindow.show();
    aiAnalysisWindow.focus();
    return;
  }

  // 创建新窗口
  aiAnalysisWindow = new BrowserWindow({
    title: 'AI 图片分析 - Pixuli',
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

  // 加载 AI 分析窗口内容
  if (VITE_DEV_SERVER_URL) {
    // 开发模式：加载 dev server 并传递 hash
    aiAnalysisWindow.loadURL(`${VITE_DEV_SERVER_URL}#ai-analysis`);
  } else {
    // 生产模式：加载本地文件
    aiAnalysisWindow.loadFile(indexHtml, { hash: 'ai-analysis' });
  }

  // 页面加载完成后确保标题正确显示
  aiAnalysisWindow.webContents.on('did-finish-load', () => {
    aiAnalysisWindow?.setTitle('AI 图片分析 - Pixuli');
  });

  // 窗口关闭时清理引用
  aiAnalysisWindow.on('closed', () => {
    aiAnalysisWindow = null;
  });

  // DevTools 可以通过快捷键手动打开（Cmd+Option+I 或 Ctrl+Shift+I）
  // if (VITE_DEV_SERVER_URL) {
  //   aiAnalysisWindow.webContents.openDevTools();
  // }
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
    title: '图片转换 - Pixuli',
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

  // 页面加载完成后确保标题正确显示
  conversionWindow.webContents.on('did-finish-load', () => {
    conversionWindow?.setTitle('图片转换 - Pixuli');
  });

  // 窗口关闭时清理引用
  conversionWindow.on('closed', () => {
    conversionWindow = null;
  });

  // DevTools 可以通过快捷键手动打开（Cmd+Option+I 或 Ctrl+Shift+I）
  // if (VITE_DEV_SERVER_URL) {
  //   conversionWindow.webContents.openDevTools();
  // }
}

/**
 * 更新系统托盘菜单
 * @param win 主窗口引用
 */
export function updateTrayMenu(win: BrowserWindow | null) {
  if (!tray) {
    return;
  }

  mainWindow = win;

  const isWindowVisible = win?.isVisible() ?? false;

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: isWindowVisible ? '隐藏窗口' : '显示窗口',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.show();
            mainWindow.focus();
            if (mainWindow.isMinimized()) {
              mainWindow.restore();
            }
          }
          // 更新菜单状态
          updateTrayMenu(mainWindow);
        }
      },
    },
    { type: 'separator' },
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
    {
      label: 'AI 图片分析',
      click: () => {
        openAIAnalysisWindow();
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        if (onQuit) {
          onQuit();
        }
      },
    },
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
 * 关闭 AI 分析窗口
 */
export function closeAIAnalysisWindow() {
  if (aiAnalysisWindow && !aiAnalysisWindow.isDestroyed()) {
    aiAnalysisWindow.close();
    aiAnalysisWindow = null;
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
  mainWindow = null;
  // 同时关闭所有窗口
  if (compressionWindow && !compressionWindow.isDestroyed()) {
    compressionWindow.close();
    compressionWindow = null;
  }
  if (conversionWindow && !conversionWindow.isDestroyed()) {
    conversionWindow.close();
    conversionWindow = null;
  }
  if (aiAnalysisWindow && !aiAnalysisWindow.isDestroyed()) {
    aiAnalysisWindow.close();
    aiAnalysisWindow = null;
  }
}

/**
 * 获取主窗口引用
 */
export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
