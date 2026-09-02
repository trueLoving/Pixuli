import { Upload } from 'lucide-react';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { defaultTranslate } from '@/i18n/locales';
import type {
  BatchUploadProgress,
  ImageCompressionOptions,
  ImageCropOptions,
  ImageItem,
  ImageUploadData,
  MultiImageUploadData,
} from '@pixuli/core/types';
import type { NativeImagePickers } from './image-upload/nativePickers';
import ImageUploadModal from './image-upload/ImageUploadModal';
import './UploadButton.css';

export interface UploadButtonProps {
  /** 上传单张图片回调 */
  onUploadImage: (data: ImageUploadData) => Promise<unknown>;
  /** 批量上传图片回调 */
  onUploadMultipleImages: (data: MultiImageUploadData) => Promise<unknown>;
  /** 是否正在加载（不再禁用「添加」按钮，避免 §5.1 锁壳） */
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
  /** 自定义 CSS 类名 */
  className?: string;
  /** Capacitor 原生选图 */
  nativePickers?: NativeImagePickers;
  /** 默认目标文件夹（当前资源库范围） */
  defaultFolder?: string;
  /** 仅显示图标（与资源库工具栏其他按钮一致） */
  iconOnly?: boolean;
  onUploadComplete?: (items: ImageItem[]) => void;
}

export interface UploadButtonHandle {
  open: () => void;
  openWithFiles: (files: File[]) => void;
}

const UploadButton = forwardRef<UploadButtonHandle, UploadButtonProps>(
  (
    {
      onUploadImage,
      onUploadMultipleImages,
      batchUploadProgress,
      t,
      enableCrop = false,
      cropOptions,
      enableCompression = false,
      compressionOptions,
      className = '',
      nativePickers,
      defaultFolder,
      iconOnly = false,
      onUploadComplete,
    },
    ref,
  ) => {
    const translate = t || defaultTranslate;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [seedFiles, setSeedFiles] = useState<File[] | null>(null);

    useImperativeHandle(ref, () => ({
      open: () => {
        setSeedFiles(null);
        setIsModalOpen(true);
      },
      openWithFiles: (files: File[]) => {
        if (files.length === 0) return;
        setSeedFiles(files);
        setIsModalOpen(true);
      },
    }));

    const handleOpenModal = () => {
      setSeedFiles(null);
      setIsModalOpen(true);
    };

    const handleCloseModal = () => {
      setIsModalOpen(false);
      setSeedFiles(null);
    };

    // §5.1：点「添加到工作区」后立刻关浮层，写入在后台进行
    const handleUploadImage = async (data: ImageUploadData) => {
      setIsModalOpen(false);
      setSeedFiles(null);
      return onUploadImage(data);
    };

    const handleUploadMultipleImages = async (data: MultiImageUploadData) => {
      setIsModalOpen(false);
      setSeedFiles(null);
      return onUploadMultipleImages(data);
    };

    const title = translate('header.upload') || '添加';

    return (
      <>
        <button
          onClick={handleOpenModal}
          className={`upload-button${iconOnly ? ' icon-only' : ''} ${className}`}
          title={title}
          aria-label={title}
          type="button"
        >
          <Upload size={18} />
          {iconOnly ? null : (
            <span className="upload-button-label">{title}</span>
          )}
        </button>

        {isModalOpen && (
          <ImageUploadModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onUploadImage={handleUploadImage}
            onUploadMultipleImages={handleUploadMultipleImages}
            loading={false}
            batchUploadProgress={batchUploadProgress}
            t={t}
            enableCrop={enableCrop}
            cropOptions={cropOptions}
            enableCompression={enableCompression}
            compressionOptions={compressionOptions}
            nativePickers={nativePickers}
            defaultFolder={defaultFolder}
            initialFiles={seedFiles ?? undefined}
            onInitialFilesConsumed={() => setSeedFiles(null)}
            onUploadComplete={onUploadComplete}
          />
        )}
      </>
    );
  },
);

UploadButton.displayName = 'UploadButton';

export default UploadButton;
