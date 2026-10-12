import { X } from 'lucide-react';
import React from 'react';
import type {
  BatchUploadProgress,
  ImageCompressionOptions,
  ImageCropOptions,
  ImageUploadData,
  MultiImageUploadData,
} from '@pixuli/core/types';
import type { NativeImagePickers } from './nativePickers';
import ImageUpload from './ImageUpload';
import './ImageUploadModal.css';

export interface ImageUploadModalProps {
  /** 是否显示弹窗 */
  isOpen: boolean;
  /** 关闭弹窗回调 */
  onClose: () => void;
  /** 上传单张图片回调 */
  onUploadImage: (data: ImageUploadData) => Promise<unknown>;
  /** 批量上传图片回调 */
  onUploadMultipleImages: (data: MultiImageUploadData) => Promise<unknown>;
  /** 是否正在加载 */
  loading?: boolean;
  /** 批量上传进度 */
  batchUploadProgress?: BatchUploadProgress | null;
  /** 翻译函数 */
  t?: (key: string) => string;
  /** 是否启用裁剪 */
  enableCrop?: boolean;
  /** 裁剪选项 */
  cropOptions?: ImageCropOptions;
  /** 是否启用压缩 */
  enableCompression?: boolean;
  /** 压缩选项 */
  compressionOptions?: ImageCompressionOptions;
  /** Capacitor 原生选图 */
  nativePickers?: NativeImagePickers;
  /** 默认目标文件夹（当前资源库范围） */
  defaultFolder?: string;
  /** 打开时预填的文件（主视图拖入） */
  initialFiles?: File[];
  onInitialFilesConsumed?: () => void;
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadImage,
  onUploadMultipleImages,
  loading = false,
  batchUploadProgress,
  t,
  enableCrop = false,
  cropOptions,
  enableCompression = false,
  compressionOptions,
  nativePickers,
  defaultFolder,
  initialFiles,
  onInitialFilesConsumed,
}) => {
  if (!isOpen) return null;

  return (
    <div className="image-upload-modal-overlay" onClick={onClose}>
      <div
        className="image-upload-modal-content"
        onClick={e => e.stopPropagation()}
      >
        <div className="image-upload-modal-header">
          <h2 className="image-upload-modal-title">
            {t?.('image.upload.addNewImage') ||
              t?.('header.upload') ||
              '添加到工作区'}
          </h2>
          <button
            onClick={onClose}
            className="image-upload-modal-close"
            type="button"
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>
        <div className="image-upload-modal-body">
          <ImageUpload
            onUploadImage={onUploadImage}
            onUploadMultipleImages={onUploadMultipleImages}
            loading={loading}
            batchUploadProgress={batchUploadProgress}
            t={t}
            enableCrop={enableCrop}
            cropOptions={cropOptions}
            enableCompression={enableCompression}
            compressionOptions={compressionOptions}
            nativePickers={nativePickers}
            defaultFolder={defaultFolder}
            initialFiles={initialFiles}
            onInitialFilesConsumed={onInitialFilesConsumed}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;
