import { app, BrowserWindow, dialog, Menu } from 'electron';
import path from 'node:path';
import os from 'os';

// 设置应用名称和顶部菜单
export function setApp(
  win: BrowserWindow,
  APP_NAME: string,
  APP_VERSION: string
) {
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

    dialog
      .showMessageBox(win!, {
        type: 'info',
        title: `About ${APP_NAME}`,
        message: APP_NAME,
        detail: aboutInfo,
        buttons: ['OK', 'Copy'],
        defaultId: 0,
        cancelId: 0,
        icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
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
