import { ipcMain } from 'electron';
import {
  plus100,
  compressToWebp,
  batchCompressToWebp,
  getImageInfo,
  convertImageFormat,
  batchConvertImageFormat,
} from 'pixuli-wasm';

export function registerWasmHandlers() {
  // WASM IPC handlers
  ipcMain.handle('wasm:plus100', async (_, input: number) => {
    try {
      return plus100(input);
    } catch (error) {
      console.error('WASM error:', error);
      throw error;
    }
  });

  // WebP压缩IPC处理器
  ipcMain.handle(
    'wasm:compress-to-webp',
    async (_, imageData: number[], options?: any) => {
      try {
        return await compressToWebp(imageData, options);
      } catch (error) {
        console.error('WebP compression error:', error);
        throw error;
      }
    }
  );

  // 批量WebP压缩IPC处理器
  ipcMain.handle(
    'wasm:batch-compress-to-webp',
    async (_, imagesData: number[][], options?: any) => {
      try {
        return await batchCompressToWebp(imagesData, options);
      } catch (error) {
        console.error('Batch WebP compression error:', error);
        throw error;
      }
    }
  );

  // 获取图片信息IPC处理器
  ipcMain.handle('wasm:get-image-info', async (_, imageData: number[]) => {
    try {
      return await getImageInfo(imageData);
    } catch (error) {
      console.error('Get image info error:', error);
      throw error;
    }
  });

  // 图片格式转换IPC处理器
  ipcMain.handle(
    'wasm:convert-image-format',
    async (_, imageData: number[], options: any) => {
      try {
        return await convertImageFormat(imageData, options);
      } catch (error) {
        console.error('Image format conversion error:', error);
        throw error;
      }
    }
  );

  // 批量图片格式转换IPC处理器
  ipcMain.handle(
    'wasm:batch-convert-image-format',
    async (_, imagesData: number[][], options: any) => {
      try {
        return await batchConvertImageFormat(imagesData, options);
      } catch (error) {
        console.error('Batch image format conversion error:', error);
        throw error;
      }
    }
  );
}
