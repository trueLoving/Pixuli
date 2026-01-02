import { BrowserWindow, Menu, nativeImage, Tray } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;

let onQuit: (() => void) | null = null;

const preload = path.join(__dirname, '../preload/index.js');
const indexHtml = path.join(__dirname, '../../dist/index.html');
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

/**
 * 获取应用图标
 * 尝试多个可能的路径，返回 NativeImage 对象
 */
function getAppIcon(): Electron.NativeImage {
  const iconPaths = [
    path.join(__dirname, '../../public/icon.png'),
    path.join(__dirname, '../../dist/icon.png'),
    path.join(process.env.VITE_PUBLIC || '', 'icon.png'),
  ];

  for (const iconPath of iconPaths) {
    try {
      const icon = nativeImage.createFromPath(iconPath);
      if (!icon.isEmpty()) {
        return icon;
      }
    } catch (error) {
      // 继续尝试下一个路径
    }
  }

  // 如果所有路径都失败，返回空图标
  return nativeImage.createEmpty();
}

/**
 * 创建系统托盘
 * @param win 主窗口引用
 * @param onQuitCallback 退出回调函数
 */
export function createTray(
  win: BrowserWindow | null,
  onQuitCallback?: () => void,
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
 * 销毁系统托盘
 */
export function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
  mainWindow = null;
}

/**
 * 获取主窗口引用
 */
export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
