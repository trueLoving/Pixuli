import {
  FormatConversionOptions,
  FormatConversionResult,
  ImageFormat,
  getFormatInfo,
  supportsLossless,
  supportsTransparency,
} from '../features/image-converter/types';

export class ImageConvertService {
  /**
   * 转换图片格式
   */
  static async convertImage(
    imageFile: File,
    options: FormatConversionOptions
  ): Promise<FormatConversionResult> {
    const startTime = performance.now();

    try {
      // 检查WASM API是否可用
      if (!window.wasmAPI || !window.wasmAPI.convertImageFormat) {
        throw new Error('WASM API 不可用，请确保应用已正确初始化');
      }

      // 获取原始图片信息
      const originalFormat = this.getImageFormat(imageFile);
      const originalDimensions = await this.getImageDimensions(imageFile);

      // 验证转换选项
      this.validateConversionOptions(originalFormat, options);

      // 将File转换为Uint8Array
      const arrayBuffer = await imageFile.arrayBuffer();
      const imageData = new Uint8Array(arrayBuffer);

      // 调用WASM转换函数
      const result = await window.wasmAPI.convertImageFormat(
        Array.from(imageData),
        options
      );

      const endTime = performance.now();
      const conversionTime = endTime - startTime;

      // 创建转换后的File对象
      const convertedFile = this.createConvertedFile(
        result.data,
        imageFile.name,
        options.targetFormat
      );

      const sizeChange = convertedFile.size - imageFile.size;
      const sizeChangeRatio = (sizeChange / imageFile.size) * 100;

      console.log(
        `图片格式转换完成: ${conversionTime.toFixed(2)}ms, 格式: ${originalFormat} -> ${options.targetFormat}`
      );

      return {
        convertedFile,
        originalSize: imageFile.size,
        convertedSize: convertedFile.size,
        sizeChange,
        sizeChangeRatio,
        originalFormat,
        targetFormat: options.targetFormat,
        originalDimensions,
        convertedDimensions: { width: result.width, height: result.height },
        conversionTime,
      };
    } catch (error) {
      const endTime = performance.now();
      console.error(
        `图片格式转换失败 after ${(endTime - startTime).toFixed(2)}ms:`,
        error
      );
      throw new Error(
        `图片格式转换失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 批量转换图片格式
   */
  static async batchConvertImages(
    imageFiles: File[],
    options: FormatConversionOptions
  ): Promise<FormatConversionResult[]> {
    const startTime = performance.now();

    try {
      // 检查WASM API是否可用
      if (!window.wasmAPI || !window.wasmAPI.batchConvertImageFormat) {
        throw new Error('WASM API 不可用，请确保应用已正确初始化');
      }

      // 将所有File转换为Array<number>
      const imagesData = await Promise.all(
        imageFiles.map(async file => {
          const arrayBuffer = await file.arrayBuffer();
          return Array.from(new Uint8Array(arrayBuffer));
        })
      );

      // 调用WASM批量转换函数
      const results = await window.wasmAPI.batchConvertImageFormat(
        imagesData,
        options
      );

      const endTime = performance.now();
      console.log(
        `批量图片格式转换完成: ${(endTime - startTime).toFixed(2)}ms`
      );

      return results.map((result, index) => {
        const file = imageFiles[index];
        const convertedFile = this.createConvertedFile(
          result.data,
          file.name,
          options.targetFormat
        );
        const sizeChange = convertedFile.size - file.size;
        const sizeChangeRatio = (sizeChange / file.size) * 100;

        return {
          convertedFile,
          originalSize: file.size,
          convertedSize: convertedFile.size,
          sizeChange,
          sizeChangeRatio,
          originalFormat: this.getImageFormat(file),
          targetFormat: options.targetFormat,
          originalDimensions: {
            width: result.originalWidth,
            height: result.originalHeight,
          },
          convertedDimensions: { width: result.width, height: result.height },
          conversionTime: result.conversionTime || 0,
        };
      });
    } catch (error) {
      const endTime = performance.now();
      console.error(
        `批量图片格式转换失败 after ${(endTime - startTime).toFixed(2)}ms:`,
        error
      );
      throw new Error(
        `批量图片格式转换失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 获取图片格式
   */
  private static getImageFormat(file: File): string {
    const mimeType = file.type.toLowerCase();
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpeg';
    if (mimeType.includes('png')) return 'png';
    if (mimeType.includes('webp')) return 'webp';
    if (mimeType.includes('gif')) return 'gif';
    if (mimeType.includes('bmp')) return 'bmp';
    if (mimeType.includes('tiff')) return 'tiff';
    return 'unknown';
  }

  /**
   * 获取图片尺寸
   */
  private static async getImageDimensions(
    file: File
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
        });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * 验证转换选项
   */
  private static validateConversionOptions(
    originalFormat: string,
    options: FormatConversionOptions
  ): void {
    const targetFormat = options.targetFormat;

    // 检查是否支持透明度
    if (options.preserveTransparency && !supportsTransparency(targetFormat)) {
      throw new Error(`${targetFormat.toUpperCase()} 格式不支持透明度`);
    }

    // 检查是否支持无损压缩
    if (options.lossless && !supportsLossless(targetFormat)) {
      throw new Error(`${targetFormat.toUpperCase()} 格式不支持无损压缩`);
    }

    // 检查质量设置
    if (
      options.quality !== undefined &&
      (options.quality < 1 || options.quality > 100)
    ) {
      throw new Error('质量设置必须在 1-100 之间');
    }
  }

  /**
   * 创建转换后的File对象
   */
  private static createConvertedFile(
    data: number[],
    originalFileName: string,
    targetFormat: ImageFormat
  ): File {
    const formatInfo = getFormatInfo(targetFormat);
    if (!formatInfo) {
      throw new Error(`不支持的格式: ${targetFormat}`);
    }

    // 生成新文件名
    const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, '');
    const newFileName = `${nameWithoutExt}.${formatInfo.extensions[0].slice(1)}`;

    // 将Array<number>转换为Uint8Array，然后转换为ArrayBuffer
    const uint8Array = new Uint8Array(data);
    return new File([uint8Array], newFileName, { type: formatInfo.mimeType });
  }

  /**
   * 获取自动转换选项
   */
  static getAutoConversionOptions(
    file: File,
    targetFormat: ImageFormat
  ): Partial<FormatConversionOptions> {
    const fileSizeMB = file.size / (1024 * 1024);
    const originalFormat = this.getImageFormat(file);

    // 基础选项
    const options: Partial<FormatConversionOptions> = {
      targetFormat,
      preserveTransparency: supportsTransparency(targetFormat),
      lossless: false,
    };

    // 根据文件大小和质量要求调整设置
    if (fileSizeMB > 10) {
      // 大文件：优先压缩
      options.quality = 60;
    } else if (fileSizeMB > 5) {
      // 中等文件：平衡质量和大小
      options.quality = 70;
    } else if (fileSizeMB > 2) {
      // 小文件：保持质量
      options.quality = 80;
    } else {
      // 很小文件：高质量
      options.quality = 85;
    }

    // 如果原格式和目标格式相同，使用无损转换
    if (originalFormat === targetFormat && supportsLossless(targetFormat)) {
      options.lossless = true;
      delete options.quality;
    }

    return options;
  }

  /**
   * 检查是否支持格式转换
   */
  static isFormatConversionSupported(): boolean {
    try {
      return !!(window.wasmAPI && window.wasmAPI.convertImageFormat);
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取支持的转换格式
   */
  static getSupportedFormats(): ImageFormat[] {
    return ['jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff'];
  }
}
