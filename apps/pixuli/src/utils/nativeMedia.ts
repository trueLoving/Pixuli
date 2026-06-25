import { isNativeMobile } from './platform';

async function webPathToFile(
  webPath: string,
  fileName: string,
  mimeType?: string,
): Promise<File> {
  const response = await fetch(webPath);
  if (!response.ok) {
    throw new Error(`fetch image failed: ${response.status}`);
  }
  const blob = await response.blob();
  const name = fileName.includes('.') ? fileName : `${fileName}.jpg`;
  return new File([blob], name, {
    type: mimeType || blob.type || 'image/jpeg',
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('read blob failed'));
        return;
      }
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('invalid data url'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error('read blob failed'));
    reader.readAsDataURL(blob);
  });
}

function isUserCancelled(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /cancel|abort|dismiss|user/i.test(message);
}

function basename(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || path;
}

/** 相机拍摄单张，返回 File[]（0 或 1 项）。 */
export async function pickImageFromCamera(): Promise<File[]> {
  if (!isNativeMobile()) {
    return [];
  }

  const { Camera, CameraResultType, CameraSource } = await import(
    '@capacitor/camera'
  );

  try {
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
    });
    if (!photo.webPath) {
      return [];
    }
    const name =
      (photo.path && basename(photo.path)) ||
      `camera-${Date.now()}.${photo.format ?? 'jpeg'}`;
    const file = await webPathToFile(
      photo.webPath,
      name,
      `image/${photo.format ?? 'jpeg'}`,
    );
    return [file];
  } catch (error) {
    if (isUserCancelled(error)) {
      return [];
    }
    throw error;
  }
}

/** 系统相册多选。 */
export async function pickImagesFromGallery(): Promise<File[]> {
  if (!isNativeMobile()) {
    return [];
  }

  const { Camera } = await import('@capacitor/camera');

  try {
    const result = await Camera.pickImages({
      quality: 90,
      limit: 0,
    });
    const files: File[] = [];
    for (let i = 0; i < result.photos.length; i++) {
      const photo = result.photos[i];
      if (!photo.webPath) {
        continue;
      }
      const name =
        (photo.path && basename(photo.path)) ||
        `gallery-${Date.now()}-${i}.${photo.format ?? 'jpeg'}`;
      files.push(
        await webPathToFile(
          photo.webPath,
          name,
          `image/${photo.format ?? 'jpeg'}`,
        ),
      );
    }
    return files;
  } catch (error) {
    if (isUserCancelled(error)) {
      return [];
    }
    throw error;
  }
}

/** 下载图片到缓存后调起系统分享（J5-05）。 */
export async function shareImageFile(
  imageName: string,
  url: string,
): Promise<void> {
  if (isNativeMobile()) {
    const { Share } = await import('@capacitor/share');
    const { Filesystem, Directory } = await import('@capacitor/filesystem');

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`fetch image failed: ${response.status}`);
    }
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);
    const safeName =
      imageName.replace(/[^\w.-]/g, '_') || `image-${Date.now()}.jpg`;
    const path = `share/${Date.now()}-${safeName}`;

    await Filesystem.writeFile({
      path,
      data: base64,
      directory: Directory.Cache,
    });
    const { uri } = await Filesystem.getUri({
      path,
      directory: Directory.Cache,
    });
    await Share.share({
      title: imageName,
      files: [uri],
      dialogTitle: imageName,
    });
    return;
  }

  if (typeof navigator !== 'undefined' && navigator.share) {
    await navigator.share({ title: imageName, url });
    return;
  }

  throw new Error('share unavailable');
}
