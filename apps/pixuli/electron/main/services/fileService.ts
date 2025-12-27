import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);

// 注册文件服务处理程序
export function registerFileHandlers() {
  // 保存文件
  ipcMain.handle(
    'file:save',
    async (event, fileName: string, content: string, mimeType?: string) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (!window) {
          throw new Error('Window not found');
        }

        // 显示保存对话框
        const result = await dialog.showSaveDialog(window, {
          title: '保存文件',
          defaultPath: fileName,
          filters: [
            { name: 'All Files', extensions: ['*'] },
            ...(mimeType === 'application/json'
              ? [{ name: 'JSON Files', extensions: ['json'] }]
              : []),
            ...(mimeType === 'text/csv'
              ? [{ name: 'CSV Files', extensions: ['csv'] }]
              : []),
          ],
        });

        if (result.canceled || !result.filePath) {
          return { success: false, canceled: true };
        }

        // 确保目录存在
        const dir = path.dirname(result.filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // 写入文件
        await writeFile(result.filePath, content, 'utf8');

        return { success: true, filePath: result.filePath };
      } catch (error) {
        console.error('Failed to save file:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : '保存文件失败',
        };
      }
    },
  );
}
