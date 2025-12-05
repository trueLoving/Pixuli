import { Eye, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { defaultTranslate } from '../../../locales';
import { ImageItem } from '../../../types/image';
import ImagePreviewModal from '../../image-browser/web/components/image-preview/ImagePreviewModal';
import './Gallery3D.css';

interface Gallery3DProps {
  images: ImageItem[];
  className?: string;
  onImageClick?: (image: ImageItem, index: number) => void;
  onClose?: () => void;
  t?: (key: string) => string;
}

const Gallery3D: React.FC<Gallery3DProps> = ({
  images,
  className = '',
  onImageClick,
  onClose,
  t,
}) => {
  const translate = t || defaultTranslate;
  const [previewImageIndex, setPreviewImageIndex] = useState<number>(-1);
  const [showPreview, setShowPreview] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startRotationRef = useRef(0);

  // 计算旋转角度
  const angleStep = 360 / Math.max(images.length, 1);

  // 初始化旋转
  useEffect(() => {
    if (images.length > 0 && carouselRef.current) {
      updateRotation();
    }
  }, [images.length, currentIndex]);

  const updateRotation = useCallback(() => {
    if (!carouselRef.current) return;
    const rotation = -currentIndex * angleStep;
    rotationRef.current = rotation;
    carouselRef.current.style.transform = `translateZ(-1000px) rotateY(${rotation}deg)`;
  }, [currentIndex, angleStep]);

  // 处理图片点击
  const handleImageClick = useCallback(
    (image: ImageItem, index: number) => {
      if (onImageClick) {
        onImageClick(image, index);
      } else {
        setPreviewImageIndex(index);
        setShowPreview(true);
      }
    },
    [onImageClick],
  );

  // 下一张
  const handleNext = useCallback(() => {
    if (images.length === 0) return;
    setCurrentIndex(prev => (prev + 1) % images.length);
  }, [images.length]);

  // 上一张
  const handlePrev = useCallback(() => {
    if (images.length === 0) return;
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // 鼠标拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startRotationRef.current = rotationRef.current;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !carouselRef.current) return;
    const deltaX = e.clientX - startXRef.current;
    const sensitivity = 0.5;
    const rotation = startRotationRef.current - deltaX * sensitivity;
    rotationRef.current = rotation;
    carouselRef.current.style.transform = `translateZ(-1000px) rotateY(${rotation}deg)`;
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    // 吸附到最近的图片
    const normalizedRotation = ((rotationRef.current % 360) + 360) % 360;
    const nearestIndex =
      Math.round(normalizedRotation / angleStep) % images.length;
    setCurrentIndex(nearestIndex);
  }, [angleStep, images.length]);

  useEffect(() => {
    if (isDraggingRef.current) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [handleMouseMove, handleMouseUp]);

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // 导航预览
  const handleNavigatePreview = useCallback((index: number) => {
    setPreviewImageIndex(index);
  }, []);

  // 关闭预览
  const handleClosePreview = useCallback(() => {
    setShowPreview(false);
    setPreviewImageIndex(-1);
  }, []);

  if (images.length === 0) {
    return (
      <div className={`gallery-3d-empty ${className}`}>
        <p>{translate('gallery3d.noImages')}</p>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`gallery-3d-container gallery-3d-fullscreen ${className}`}
        onMouseDown={handleMouseDown}
      >
        {/* 关闭按钮 */}
        {onClose && (
          <button
            onClick={onClose}
            className="gallery-3d-close-button"
            title={translate('common.close')}
          >
            <X className="gallery-3d-close-icon" />
          </button>
        )}
        <div className="gallery-3d-scene">
          <div ref={carouselRef} className="gallery-3d-carousel">
            {images.map((image, index) => {
              const angle = index * angleStep;
              return (
                <div
                  key={`${image.id}-${index}`}
                  className="gallery-3d-item"
                  style={{
                    transform: `rotateY(${angle}deg) translateZ(400px)`,
                  }}
                  onClick={() => handleImageClick(image, index)}
                >
                  <div className="gallery-3d-item-wrapper">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="gallery-3d-image"
                      loading="lazy"
                      onError={e => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="gallery-3d-overlay">
                      <Eye className="gallery-3d-icon" />
                      <span className="gallery-3d-name">{image.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="gallery-3d-controls">
          <button
            className="gallery-3d-control-button"
            onClick={handlePrev}
            title={translate('gallery3d.previous')}
          >
            ←
          </button>
          <div className="gallery-3d-counter">
            {currentIndex + 1} / {images.length}
          </div>
          <button
            className="gallery-3d-control-button"
            onClick={handleNext}
            title={translate('gallery3d.next')}
          >
            →
          </button>
        </div>
      </div>

      {/* 预览模态框 */}
      {showPreview && previewImageIndex >= 0 && (
        <ImagePreviewModal
          isOpen={showPreview}
          onClose={handleClosePreview}
          image={images[previewImageIndex]}
          images={images}
          currentIndex={previewImageIndex}
          onNavigate={handleNavigatePreview}
          t={translate}
        />
      )}
    </>
  );
};

export default Gallery3D;
