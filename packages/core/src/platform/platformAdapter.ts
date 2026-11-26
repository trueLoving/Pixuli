/**
 * 平台适配接口
 * 不同平台（web、desktop、mobile）可以实现此接口来适配各自的特殊需求。
 * 不含 Kind 级文件处理（压缩/预览等）。
 */

import { guessMimeType } from '../utils/mime';

export interface PlatformAdapter {
  /**
   * 探测栅格图尺寸（非图片返回 0×0）。
   * 用于入库填 width/height，不是 Kind process。
   */
  getImageDimensions(
    file: File | string,
  ): Promise<{ width: number; height: number }>;

  /**
   * 将文件转换为 base64
   * @param file 文件（web/desktop）或 URI（mobile）
   */
  fileToBase64(file: File | string): Promise<string>;

  /**
   * 获取文件大小
   */
  getFileSize(file: File | string): Promise<number>;

  /**
   * 获取 MIME 类型（优先 File.type，否则按扩展名表）
   */
  getMimeType(file: File | string, fileName: string): Promise<string>;
}

/**
 * 默认平台适配器（用于 web 端）
 */
export class DefaultPlatformAdapter implements PlatformAdapter {
  async getImageDimensions(
    file: File | string,
  ): Promise<{ width: number; height: number }> {
    if (typeof file === 'string') {
      return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
          resolve({
            width: img.naturalWidth || img.width || 0,
            height: img.naturalHeight || img.height || 0,
          });
        };
        img.onerror = () => {
          resolve({ width: 0, height: 0 });
        };
        img.src = file;
      });
    }

    return new Promise(resolve => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      const timeout = setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        resolve({ width: 0, height: 0 });
      }, 10000);

      img.onload = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(objectUrl);
        resolve({
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
        });
      };

      img.onerror = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(objectUrl);
        resolve({ width: 0, height: 0 });
      };

      img.src = objectUrl;
    });
  }

  async fileToBase64(file: File | string): Promise<string> {
    if (typeof file === 'string') {
      try {
        const response = await fetch(file);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Failed to convert URI to base64:', error);
        throw new Error('文件读取失败');
      }
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        const base64Content = base64.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = error => reject(error);
    });
  }

  async getFileSize(file: File | string): Promise<number> {
    if (typeof file === 'string') {
      try {
        const response = await fetch(file, { method: 'HEAD' });
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          return parseInt(contentLength, 10);
        }
        return 0;
      } catch {
        return 0;
      }
    }

    return file.size;
  }

  async getMimeType(file: File | string, fileName: string): Promise<string> {
    if (typeof file === 'string') {
      return guessMimeType(fileName);
    }

    return file.type || guessMimeType(fileName);
  }
}
