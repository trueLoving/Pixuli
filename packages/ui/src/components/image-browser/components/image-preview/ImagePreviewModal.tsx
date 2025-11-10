import { ChevronLeft, ChevronRight, ExternalLink, Link, X } from 'lucide-react';
import React, { useCallback, useEffect } from 'react';
import { defaultTranslate } from '../../../../locales';
import { ImageItem } from '../../../../types/image';
import './ImagePreviewModal.css';

interface ImagePreviewModalProps {
  image: ImageItem | null;
  images: ImageItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (index: number) => void;
  formatFileSize?: (size: number) => string;
  onCopyUrl?: (url: string, type: 'url' | 'githubUrl') => Promise<void>;
  onOpenUrl?: (url: string) => void;
  t?: (key: string) => string;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  image,
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  formatFileSize = (size: number) => `${(size / 1024 / 1024).toFixed(2)} MB`,
  onCopyUrl,
  onOpenUrl,
  t,
}) => {
  const translate = t || defaultTranslate;

  // 导航功能
  const handlePrevious = useCallback(() => {
    if (onNavigate && images.length > 1) {
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
      onNavigate(prevIndex);
    }
  }, [onNavigate, currentIndex, images.length]);

  const handleNext = useCallback(() => {
    if (onNavigate && images.length > 1) {
      const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
      onNavigate(nextIndex);
    }
  }, [onNavigate, currentIndex, images.length]);

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          handlePrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleNext();
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handlePrevious, handleNext, onClose]);

  if (!isOpen || !image) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getImageDimensions = () => {
    // 直接使用元数据中的尺寸
    if (image.width > 0 && image.height > 0) {
      return `${image.width} × ${image.height}`;
    }
    // 如果没有尺寸数据或尺寸数据不合法，显示暂无尺寸数据
    return translate('image.grid.dimensionsUnknown');
  };

  const handleCopyUrl = async (url: string, type: 'url' | 'githubUrl') => {
    if (onCopyUrl) {
      await onCopyUrl(url, type);
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch (error) {
        console.error('Failed to copy URL:', error);
      }
    }
  };

  const handleOpenUrl = (url: string) => {
    if (onOpenUrl) {
      onOpenUrl(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="image-preview-modal-overlay">
      <div className="image-preview-modal-container">
        <div className="image-preview-modal-content">
          <button
            onClick={onClose}
            className="image-preview-modal-close"
            title={translate('common.close')}
          >
            <X className="w-5 h-5" />
          </button>

          {/* 左箭头 */}
          {images.length > 1 && (
            <button
              onClick={handlePrevious}
              className="image-preview-modal-nav image-preview-modal-nav-left"
              title="上一张图片 (←)"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* 右箭头 */}
          {images.length > 1 && (
            <button
              onClick={handleNext}
              className="image-preview-modal-nav image-preview-modal-nav-right"
              title="下一张图片 (→)"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          <img
            src={image.url}
            alt={image.name}
            className="image-preview-modal-image"
          />
        </div>

        <div className="image-preview-modal-info">
          <h3 className="image-preview-modal-title">{image.name}</h3>

          {/* 图片计数 */}
          {images.length > 1 && (
            <div className="image-preview-modal-counter">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {image.description && (
            <p className="image-preview-modal-description">
              {image.description}
            </p>
          )}

          <div className="image-preview-modal-details">
            <div className="image-preview-modal-detail-item">
              <span>{getImageDimensions()}</span>
            </div>
            {image.size > 0 && (
              <div className="image-preview-modal-detail-item">
                <span>{formatFileSize(image.size)}</span>
              </div>
            )}
            <div className="image-preview-modal-detail-item">
              <span>{formatDate(image.createdAt)}</span>
            </div>
          </div>

          {/* 在线地址操作 */}
          <div className="image-preview-modal-actions">
            <button
              onClick={() => handleCopyUrl(image.url, 'url')}
              className="image-preview-modal-action-button image-preview-modal-action-button-primary"
            >
              <Link className="w-3 h-3" />
              <span>{translate('image.grid.copyUrl')}</span>
            </button>
            <button
              onClick={() => handleOpenUrl(image.url)}
              className="image-preview-modal-action-button image-preview-modal-action-button-secondary"
            >
              <ExternalLink className="w-3 h-3" />
              <span>{translate('image.grid.openUrl')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;
