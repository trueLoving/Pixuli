import { Upload } from 'lucide-react';
import React, { useState } from 'react';
import { defaultTranslate } from '../../locales';
import type {
  BatchUploadProgress,
  ImageCompressionOptions,
  ImageCropOptions,
  ImageUploadData,
  MultiImageUploadData,
} from '../../types/image';
import ImageUploadModal from '../image-upload/ImageUploadModal';
import './UploadButton.css';

export interface UploadButtonProps {
  /** 上传单张图片回调 */
  onUploadImage: (data: ImageUploadData) => Promise<void>;
  /** 批量上传图片回调 */
  onUploadMultipleImages: (data: MultiImageUploadData) => Promise<void>;
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
  /** 自定义 CSS 类名 */
  className?: string;
}

const UploadButton: React.FC<UploadButtonProps> = ({
  onUploadImage,
  onUploadMultipleImages,
  loading = false,
  batchUploadProgress,
  t,
  enableCrop = false,
  cropOptions,
  enableCompression = false,
  compressionOptions,
  className = '',
}) => {
  const translate = t || defaultTranslate;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // 包装上传回调，上传成功后关闭弹窗
  const handleUploadImage = async (data: ImageUploadData) => {
    try {
      await onUploadImage(data);
      // 上传成功后关闭弹窗
      setIsModalOpen(false);
    } catch (error) {
      // 上传失败时不关闭弹窗，让用户看到错误信息
      throw error;
    }
  };

  const handleUploadMultipleImages = async (data: MultiImageUploadData) => {
    try {
      await onUploadMultipleImages(data);
      // 上传成功后关闭弹窗
      setIsModalOpen(false);
    } catch (error) {
      // 上传失败时不关闭弹窗，让用户看到错误信息
      throw error;
    }
  };

  const title = translate('header.upload') || '上传';

  return (
    <>
      <button
        onClick={handleOpenModal}
        disabled={loading}
        className={`upload-button ${className}`}
        title={title}
        type="button"
      >
        <Upload size={18} />
        <span className="upload-button-label">{title}</span>
      </button>

      {isModalOpen && (
        <ImageUploadModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onUploadImage={handleUploadImage}
          onUploadMultipleImages={handleUploadMultipleImages}
          loading={loading}
          batchUploadProgress={batchUploadProgress}
          t={t}
          enableCrop={enableCrop}
          cropOptions={cropOptions}
          enableCompression={enableCompression}
          compressionOptions={compressionOptions}
        />
      )}
    </>
  );
};

export default UploadButton;
