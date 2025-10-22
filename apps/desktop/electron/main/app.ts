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
            label: '退出',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            },
          },
        ],
      },
      {
        label: '帮助',
        submenu: [
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
          {
            label: 'Open Process Explorer',
            click: () => {
              if (win) {
                win.webContents.openDevTools({ mode: 'detach' });
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
