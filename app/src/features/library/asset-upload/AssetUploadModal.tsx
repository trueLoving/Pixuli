import { X } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import type {
  BatchUploadProgress,
  ImageCompressionOptions,
  ImageCropOptions,
  AssetUploadData,
  MultiAssetUploadData,
} from '@pixuli/core/types';
import type { NativeImagePickers } from './nativePickers';
import AssetUpload from './AssetUpload';
import './AssetUploadModal.css';

export interface AssetUploadModalProps {
  /** 是否显示弹窗 */
  isOpen: boolean;
  /** 关闭弹窗回调 */
  onClose: () => void;
  /** 上传单张图片回调 */
  onUploadAsset: (data: AssetUploadData) => Promise<unknown>;
  /** 批量上传图片回调 */
  onUploadMultipleAssets: (data: MultiAssetUploadData) => Promise<unknown>;
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

const AssetUploadModal: React.FC<AssetUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadAsset,
  onUploadMultipleAssets,
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
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const title =
    t?.('image.upload.addNewImage') || t?.('header.upload') || '添加到工作区';

  return (
    <div
      className="asset-upload-modal-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="asset-upload-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-upload-modal-title"
        tabIndex={-1}
        onClick={event => event.stopPropagation()}
      >
        <div className="asset-upload-modal-header">
          <h2
            id="asset-upload-modal-title"
            className="asset-upload-modal-title"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="asset-upload-modal-close"
            type="button"
            aria-label={t?.('image.upload.close') || '关闭'}
          >
            <X size={20} />
          </button>
        </div>
        <div className="asset-upload-modal-body">
          <AssetUpload
            onUploadAsset={onUploadAsset}
            onUploadMultipleAssets={onUploadMultipleAssets}
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

export default AssetUploadModal;
