import type { ImageItem } from '@pixuli/core/types';
import type { NativeImagePickers } from '@/features/library/image-upload/nativePickers';
import { useCallback, useMemo } from 'react';
import {
  pickImageFromCamera,
  pickImagesFromGallery,
  shareImageFile,
} from '@/platforms/mobile/nativeMedia';
import { isNativeMobile } from '@/platforms/platform';

export function useNativeImagePickers(): NativeImagePickers | undefined {
  return useMemo(() => {
    if (!isNativeMobile()) {
      return undefined;
    }
    return {
      pickFromCamera: pickImageFromCamera,
      pickFromGallery: pickImagesFromGallery,
    };
  }, []);
}

export function useNativeShareImage():
  | ((image: ImageItem) => Promise<void>)
  | undefined {
  const onShareImage = useCallback(async (image: ImageItem) => {
    await shareImageFile(image.name, image.url);
  }, []);

  return useMemo(
    () => (isNativeMobile() ? onShareImage : undefined),
    [onShareImage],
  );
}
