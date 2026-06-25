/** Capacitor 等原生壳注入的选图能力（REF-510 #120）；@pixuli/ui 不依赖 Capacitor。 */
export interface NativeImagePickers {
  pickFromCamera: () => Promise<File[]>;
  pickFromGallery: () => Promise<File[]>;
}
