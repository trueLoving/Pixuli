import { app, BrowserWindow, dialog, Menu, nativeImage } from 'electron';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'os';

// 设置应用名称和顶部菜单
export function setApp(
  win: BrowserWindow,
  APP_NAME: string,
  APP_VERSION: string,
) {
  // 获取应用图标
  function getAppIcon(): Electron.NativeImage {
    const require = createRequire(import.meta.url);
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const APP_ROOT = path.join(__dirname, '../..');
    const VITE_PUBLIC =
      process.env.VITE_PUBLIC || path.join(APP_ROOT, 'public');
    const RENDERER_DIST = path.join(APP_ROOT, 'dist');

    const iconPaths = [
      path.join(VITE_PUBLIC, 'icon.png'),
      path.join(RENDERER_DIST, 'icon.png'),
      path.join(APP_ROOT, 'public', 'icon.png'),
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

  // 显示关于对话框
  function showAboutDialog() {
    const aboutInfo = `
  ${APP_NAME}
  版本: ${APP_VERSION}
  构建日期: ${new Date().toISOString().split('T')[0]}
  Electron: ${process.versions.electron}
  Chromium: ${process.versions.chrome}
  Node.js: ${process.versions.node}
  V8: ${process.versions.v8}
  操作系统: ${os.type()} ${os.arch()} ${os.release()}
    `.trim();

    const appIcon = getAppIcon();

    dialog
      .showMessageBox(win!, {
        type: 'info',
        title: `About ${APP_NAME}`,
        message: APP_NAME,
        detail: aboutInfo,
        buttons: ['OK', 'Copy'],
        defaultId: 0,
        cancelId: 0,
        icon: appIcon,
      })
      .then(result => {
        if (result.response === 1) {
          // Copy button clicked
          require('electron').clipboard.writeText(aboutInfo);
        }
      });
  }

  // 创建自定义菜单
  function createMenu() {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: APP_NAME,
        submenu: [
          {
            label: `About ${APP_NAME}`,
            click: () => {
              showAboutDialog();
            },
          },
          { type: 'separator' },
          {
            label: 'Preferences...',
            accelerator: process.platform === 'darwin' ? 'Cmd+,' : 'Ctrl+,',
            click: () => {
              // 触发配置模态框打开事件
              if (win) {
                win.webContents.send('open-config-modal');
              }
            },
          },
          { type: 'separator' },
          {
            label:
              process.platform === 'darwin' ? `Hide ${APP_NAME}` : 'Minimize',
            accelerator: process.platform === 'darwin' ? 'Cmd+H' : 'Ctrl+M',
            click: () => {
              if (win) {
                win.minimize();
              }
            },
          },
          {
            label: 'Quit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            },
          },
        ],
      },
      {
        label: 'Edit',
        submenu: [
          {
            label: 'Undo',
            accelerator: 'CmdOrCtrl+Z',
            role: 'undo',
          },
          {
            label: 'Redo',
            accelerator: 'Shift+CmdOrCtrl+Z',
            role: 'redo',
          },
          { type: 'separator' },
          {
            label: 'Cut',
            accelerator: 'CmdOrCtrl+X',
            role: 'cut',
          },
          {
            label: 'Copy',
            accelerator: 'CmdOrCtrl+C',
            role: 'copy',
          },
          {
            label: 'Paste',
            accelerator: 'CmdOrCtrl+V',
            role: 'paste',
          },
          {
            label: 'Select All',
            accelerator: 'CmdOrCtrl+A',
            role: 'selectAll',
          },
        ],
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            click: () => {
              if (win) {
                win.reload();
              }
            },
          },
          {
            label: 'Force Reload',
            accelerator: 'CmdOrCtrl+Shift+R',
            click: () => {
              if (win) {
                win.webContents.reloadIgnoringCache();
              }
            },
          },
          {
            label: 'Toggle Developer Tools',
            accelerator:
              process.platform === 'darwin' ? 'Cmd+Option+I' : 'Ctrl+Shift+I',
            click: () => {
              if (win) {
                win.webContents.toggleDevTools();
              }
            },
          },
          { type: 'separator' },
          {
            label: 'Actual Size',
            accelerator: 'CmdOrCtrl+0',
            click: () => {
              if (win) {
                win.webContents.setZoomLevel(0);
              }
            },
          },
          {
            label: 'Zoom In',
            accelerator: 'CmdOrCtrl+Plus',
            click: () => {
              if (win) {
                const currentZoom = win.webContents.getZoomLevel();
                win.webContents.setZoomLevel(currentZoom + 0.5);
              }
            },
          },
          {
            label: 'Zoom Out',
            accelerator: 'CmdOrCtrl+-',
            click: () => {
              if (win) {
                const currentZoom = win.webContents.getZoomLevel();
                win.webContents.setZoomLevel(currentZoom - 0.5);
              }
            },
          },
          { type: 'separator' },
          {
            label: 'Toggle Fullscreen',
            accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
            click: () => {
              if (win) {
                win.setFullScreen(!win.isFullScreen());
              }
            },
          },
        ],
      },
      {
        label: 'Window',
        submenu: [
          {
            label: 'Minimize',
            accelerator: 'CmdOrCtrl+M',
            click: () => {
              if (win) {
                win.minimize();
              }
            },
          },
          {
            label: 'Close',
            accelerator: 'CmdOrCtrl+W',
            click: () => {
              if (win) {
                win.close();
              }
            },
          },
        ],
      },
      {
        label: 'Help',
        submenu: [
          {
            label: `About ${APP_NAME}`,
            click: () => {
              showAboutDialog();
            },
          },
          {
            label: 'Keyboard Shortcuts',
            accelerator: 'F1',
            click: () => {
              // 触发键盘帮助事件
              if (win) {
                win.webContents.send('open-keyboard-help');
              }
            },
          },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  // 设置应用名称
  app.setName(APP_NAME);

  // 创建自定义菜单
  createMenu();
}
