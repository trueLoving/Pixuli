import type { AssetItem } from '@pixuli/core/types';
import type { NativeImagePickers } from '@/features/library/asset-upload/nativePickers';
import { useCallback, useMemo } from 'react';
import {
  pickImageFromCamera,
  pickImagesFromGallery,
  shareImageFile,
} from '@/platforms/mobile/nativeMedia';
import { isNativeMobile } from '@/platforms/platform';

export function useNativeAssetPickers(): NativeImagePickers | undefined {
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

export function useNativeShareAsset():
  | ((asset: AssetItem) => Promise<void>)
  | undefined {
  const onShareAsset = useCallback(async (asset: AssetItem) => {
    await shareImageFile(asset.name, asset.url);
  }, []);

  return useMemo(
    () => (isNativeMobile() ? onShareAsset : undefined),
    [onShareAsset],
  );
}
