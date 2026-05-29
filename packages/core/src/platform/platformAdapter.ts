/**
 * 平台适配接口
 * 不同平台（web、desktop、mobile）可以实现此接口来适配各自的特殊需求
 */
export interface PlatformAdapter {
  /**
   * 获取图片尺寸信息
   * @param file 图片文件（web/desktop）或 URI（mobile）
   */
  getImageDimensions(
    file: File | string,
  ): Promise<{ width: number; height: number }>;

  /**
   * 将文件转换为 base64
   * @param file 图片文件（web/desktop）或 URI（mobile）
   */
  fileToBase64(file: File | string): Promise<string>;

  /**
   * 获取文件大小
   * @param file 图片文件（web/desktop）或 URI（mobile）
   */
  getFileSize(file: File | string): Promise<number>;

  /**
   * 获取 MIME 类型
   * @param file 图片文件（web/desktop）或 URI（mobile）
   * @param fileName 文件名
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
      // Mobile 端 URI 处理
      return new Promise((resolve, _reject) => {
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

    // Web/Desktop 端 File 处理
    return new Promise((resolve, _reject) => {
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
      // Mobile 端 URI 处理
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

    // Web/Desktop 端 File 处理
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
      // Mobile 端 URI 处理
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

    // Web/Desktop 端 File 处理
    return file.size;
  }

  async getMimeType(file: File | string, fileName: string): Promise<string> {
    if (typeof file === 'string') {
      // Mobile 端：从文件名推断
      return this.getMimeTypeFromFileName(fileName);
    }

    // Web/Desktop 端：优先使用文件的 type，否则从文件名推断
    return file.type || this.getMimeTypeFromFileName(fileName);
  }

  private getMimeTypeFromFileName(fileName: string): string {
    const extension = fileName
      .toLowerCase()
      .substring(fileName.lastIndexOf('.'));
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };
    return mimeTypes[extension] || 'image/jpeg';
  }
}
