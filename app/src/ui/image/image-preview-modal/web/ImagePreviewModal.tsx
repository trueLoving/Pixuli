import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import React, { useCallback, useEffect } from 'react';
import { defaultTranslate } from '@/ui/locales';
import { ImageItem } from '@pixuli/core/types';
import './ImagePreviewModal.css';

interface ImagePreviewModalProps {
  image: ImageItem | null;
  images: ImageItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (index: number) => void;
  formatFileSize?: (size: number) => string;
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
  t,
}) => {
  const translate = t || defaultTranslate;

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
    if (image.width > 0 && image.height > 0) {
      return `${image.width} × ${image.height}`;
    }
    return translate('image.grid.dimensionsUnknown');
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

          {images.length > 1 && (
            <button
              onClick={handlePrevious}
              className="image-preview-modal-nav image-preview-modal-nav-left"
              title="上一张图片 (←)"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

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
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;
