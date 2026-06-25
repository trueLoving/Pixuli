import type { ImageItem } from '@pixuli/core/types';
import type { NativeImagePickers } from '@pixuli/ui/image/image-upload/common/nativePickers';
import { useCallback, useMemo } from 'react';
import {
  pickImageFromCamera,
  pickImagesFromGallery,
  shareImageFile,
} from '@/utils/nativeMedia';
import { isNativeMobile } from '@/utils/platform';

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
