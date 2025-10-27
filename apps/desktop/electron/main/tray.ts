import { app, BrowserWindow, Menu, nativeImage, Tray } from 'electron';
import fs from 'fs';
import path from 'node:path';

let tray: Tray | null = null;

let onQuit: (() => void) | null = null;

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

  console.log('创建托盘图标，当前目录:', __dirname);
  console.log('VITE_PUBLIC:', process.env.VITE_PUBLIC);

  // 尝试多个可能的图标路径
  const possibleIconPaths = [
    path.join(process.env.VITE_PUBLIC || '', 'favicon.ico'),
    path.join(process.env.VITE_PUBLIC || '', 'icon.png'),
    path.join(__dirname, '../../dist/favicon.ico'),
    path.join(__dirname, '../../public/favicon.ico'),
    path.join(__dirname, '../../dist/icon.png'),
    path.join(__dirname, '../../public/icon.png'),
    path.join(__dirname, '../../build/icon.png'),
  ];

  let icon = null;
  for (const iconPath of possibleIconPaths) {
    try {
      console.log('尝试加载图标:', iconPath);
      if (fs.existsSync(iconPath)) {
        console.log('图标文件存在:', iconPath);
        icon = nativeImage.createFromPath(iconPath);
        if (!icon.isEmpty()) {
          console.log('托盘图标加载成功:', iconPath);
          break;
        } else {
          console.warn('图标为空:', iconPath);
        }
      } else {
        console.log('图标文件不存在:', iconPath);
      }
    } catch (error) {
      console.warn('尝试加载图标失败:', iconPath, error);
    }
  }

  // 如果所有路径都失败，创建一个简单的默认图标
  if (!icon || icon.isEmpty()) {
    console.warn('无法加载图标文件，将使用默认图标');
    // 创建一个 16x16 的单色图标 (Base64 编码的 1 像素 PNG)
    const base64Icon =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    icon = nativeImage.createFromDataURL('data:image/png;base64,' + base64Icon);
  }

  // macOS 需要设置为模板图像（单色），在调整大小之前设置
  if (process.platform === 'darwin') {
    icon.setTemplateImage(true);
  }

  // 调整图标大小
  let trayIcon = icon.resize({ width: 16, height: 16 });

  // 创建托盘
  tray = new Tray(trayIcon);

  // 设置托盘提示
  tray.setToolTip('Pixuli - 智能图片管理工具');

  // 创建上下文菜单
  updateTrayMenu(win);

  // 点击托盘图标时切换窗口显示/隐藏
  tray.on('click', () => {
    if (win) {
      if (win.isVisible()) {
        win.hide();
      } else {
        win.show();
        win.focus();
      }
    }
  });

  // 右键点击托盘图标显示菜单
  tray.on('right-click', () => {
    tray?.popUpContextMenu();
  });

  // macOS 特有：双击托盘图标
  if (process.platform === 'darwin') {
    tray.on('double-click', () => {
      if (win) {
        if (win.isVisible()) {
          win.hide();
        } else {
          win.show();
          win.focus();
        }
      }
    });
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
        // 确保窗口显示
        if (win) {
          if (!win.isVisible()) {
            win.show();
          }
          win.focus();
        }
      },
    },
    {
      label: '图片转换',
      click: () => {
        // 确保窗口显示
        if (win) {
          if (!win.isVisible()) {
            win.show();
          }
          win.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: win?.isVisible() ? '隐藏窗口' : '显示窗口',
      click: () => {
        if (win) {
          if (win.isVisible()) {
            win.hide();
          } else {
            win.show();
            win.focus();
          }
          // 更新菜单
          updateTrayMenu(win);
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
        app.quit();
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
}
