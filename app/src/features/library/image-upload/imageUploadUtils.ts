export function resolveDefaultFolder(folder?: string): string {
  if (!folder || folder === '__root__') return 'images';
  return folder.replace(/\/+$/, '');
}

export function isPreviewableMedia(file: File): boolean {
  return file.type.startsWith('image/') || file.type.startsWith('video/');
}

export function needsRichConfirm(files: File[]): boolean {
  return files.some(
    file => file.type.startsWith('image/') || file.type.startsWith('video/'),
  );
}

export function fileTypeLabel(
  file: File,
  translate: (key: string) => string,
): string {
  if (file.type.startsWith('image/')) {
    return translate('image.upload.typeImage');
  }
  if (file.type.startsWith('video/')) {
    return translate('image.upload.typeVideo');
  }
  if (
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf')
  ) {
    return translate('image.upload.typePdf');
  }
  return translate('image.upload.typeOther');
}

export function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    const timeout = setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('获取图片尺寸超时'));
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
      reject(new Error('图片加载失败'));
    };

    img.src = objectUrl;
  });
}

export function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
