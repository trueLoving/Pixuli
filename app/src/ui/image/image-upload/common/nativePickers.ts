import type { ImageCaptureMetadata } from '@pixuli/core/types';

/** Capacitor 等原生壳注入的选图能力（REF-510 #120 / REF-511 #141） */
export interface NativePickedImage {
  file: File;
  captureMetadata?: ImageCaptureMetadata;
}

export interface NativeImagePickers {
  pickFromCamera: () => Promise<NativePickedImage[]>;
  pickFromGallery: () => Promise<NativePickedImage[]>;
}
