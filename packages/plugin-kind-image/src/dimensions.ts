export type ImageDimensions = {
  width: number;
  height: number;
};

export type ImageInfo = ImageDimensions & {
  naturalWidth: number;
  naturalHeight: number;
  aspectRatio: number;
  orientation: 'landscape' | 'portrait' | 'square';
};

/**
 * 按最大边约束计算输出尺寸（可选保持宽高比）。
 */
export function calculateDisplayDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth?: number,
  maxHeight?: number,
  keepAspectRatio: boolean = true,
): ImageDimensions {
  let width = originalWidth;
  let height = originalHeight;

  if (maxWidth && maxHeight) {
    if (keepAspectRatio) {
      const scaleX = maxWidth / originalWidth;
      const scaleY = maxHeight / originalHeight;
      const scale = Math.min(scaleX, scaleY);
      width = Math.round(originalWidth * scale);
      height = Math.round(originalHeight * scale);
    } else {
      width = Math.min(originalWidth, maxWidth);
      height = Math.min(originalHeight, maxHeight);
    }
  } else if (maxWidth) {
    if (keepAspectRatio) {
      const scale = maxWidth / originalWidth;
      width = maxWidth;
      height = Math.round(originalHeight * scale);
    } else {
      width = Math.min(originalWidth, maxWidth);
    }
  } else if (maxHeight) {
    if (keepAspectRatio) {
      const scale = maxHeight / originalHeight;
      height = maxHeight;
      width = Math.round(originalWidth * scale);
    } else {
      height = Math.min(originalHeight, maxHeight);
    }
  }

  return { width, height };
}

export function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('图片加载失败'));
    };

    img.src = objectUrl;
  });
}

export function getImageInfo(file: File): Promise<ImageInfo> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.width;
      const height = img.height;
      const naturalWidth = img.naturalWidth || width;
      const naturalHeight = img.naturalHeight || height;
      const aspectRatio = width / height;

      let orientation: ImageInfo['orientation'];
      if (width > height) {
        orientation = 'landscape';
      } else if (width < height) {
        orientation = 'portrait';
      } else {
        orientation = 'square';
      }

      resolve({
        width,
        height,
        naturalWidth,
        naturalHeight,
        aspectRatio,
        orientation,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('图片加载失败'));
    };

    img.src = objectUrl;
  });
}

export function getImageDimensionsFromUrl(
  url: string,
): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };

    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}
