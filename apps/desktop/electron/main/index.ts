import { app, BrowserWindow, shell, ipcMain, Menu, dialog } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import { update } from './update'
import { GitHubService } from './githubService'
import { aiService } from './aiService'
import { modelDownloadService } from './modelDownloadService'
import { plus100, compressToWebp, batchCompressToWebp, getImageInfo, convertImageFormat, batchConvertImageFormat } from 'pixuli-wasm'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 获取版本信息
const packageJson = require('../../package.json')
const APP_VERSION = packageJson.version
const APP_NAME = packageJson.productName || packageJson.name

// 设置应用名称
app.setName(APP_NAME)

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
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.js')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

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
  `.trim()

  dialog.showMessageBox(win!, {
    type: 'info',
    title: `About ${APP_NAME}`,
    message: APP_NAME,
    detail: aboutInfo,
    buttons: ['OK', 'Copy'],
    defaultId: 0,
    cancelId: 0,
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico')
  }).then((result) => {
    if (result.response === 1) {
      // Copy button clicked
      require('electron').clipboard.writeText(aboutInfo)
    }
  })
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
            showAboutDialog()
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Cmd+Option+I' : 'Ctrl+Shift+I',
          click: () => {
            if (win) {
              win.webContents.toggleDevTools()
            }
          }
        },
        {
          label: 'Open Process Explorer',
          click: () => {
            if (win) {
              win.webContents.openDevTools({ mode: 'detach' })
            }
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

async function createWindow() {
  win = new BrowserWindow({
    title: `${APP_NAME} - 智能图片管理工具 v${APP_VERSION}`,
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  })

  // 设置自定义菜单
  createMenu()

  if (VITE_DEV_SERVER_URL) { // #298
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // Auto update
  update(win)
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})

// Initialize GitHub service
const githubService = new GitHubService()

// Initialize AI service and add default models
aiService.addDefaultModels()

// WASM IPC handlers
ipcMain.handle('wasm:plus100', async (_, input: number) => {
  try {
    return plus100(input)
  } catch (error) {
    console.error('WASM error:', error)
    throw error
  }
})

// WebP压缩IPC处理器
ipcMain.handle('wasm:compress-to-webp', async (_, imageData: number[], options?: any) => {
  try {
    return await compressToWebp(imageData, options)
  } catch (error) {
    console.error('WebP compression error:', error)
    throw error
  }
})

// 批量WebP压缩IPC处理器
ipcMain.handle('wasm:batch-compress-to-webp', async (_, imagesData: number[][], options?: any) => {
  try {
    return await batchCompressToWebp(imagesData, options)
  } catch (error) {
    console.error('Batch WebP compression error:', error)
    throw error
  }
})

// 获取图片信息IPC处理器
ipcMain.handle('wasm:get-image-info', async (_, imageData: number[]) => {
  try {
    return await getImageInfo(imageData)
  } catch (error) {
    console.error('Get image info error:', error)
    throw error
  }
})

// 图片格式转换IPC处理器
ipcMain.handle('wasm:convert-image-format', async (_, imageData: number[], options: any) => {
  try {
    return await convertImageFormat(imageData, options)
  } catch (error) {
    console.error('Image format conversion error:', error)
    throw error
  }
})

// 批量图片格式转换IPC处理器
ipcMain.handle('wasm:batch-convert-image-format', async (_, imagesData: number[][], options: any) => {
  try {
    return await batchConvertImageFormat(imagesData, options)
  } catch (error) {
    console.error('Batch image format conversion error:', error)
    throw error
  }
})

// Initialize AI service and add default models
aiService.addDefaultModels()

// AI IPC handlers are registered in AIService constructor
// Model Download IPC handlers are registered in ModelDownloadService constructor
