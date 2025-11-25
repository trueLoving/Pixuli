import { Eye, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLazyLoad } from '../../hooks';
import { defaultTranslate } from '../../locales';
import { ImageItem } from '../../types/image';
import ImagePreviewModal from '../image-browser/components/image-preview/ImagePreviewModal';
import './PhotoWall.css';

interface PhotoWallProps {
  images: ImageItem[];
  className?: string;
  onImageClick?: (image: ImageItem, index: number) => void;
  onClose?: () => void;
  t?: (key: string) => string;
}

const PhotoWall: React.FC<PhotoWallProps> = ({
  images,
  className = '',
  onImageClick,
  onClose,
  t,
}) => {
  const translate = t || defaultTranslate;
  const [previewImageIndex, setPreviewImageIndex] = useState<number>(-1);
  const [showPreview, setShowPreview] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState<number>(4);
  const [columnHeights, setColumnHeights] = useState<number[]>([]);
  const [imageElements, setImageElements] = useState<
    Array<{ image: ImageItem; index: number; height: number; column: number }>
  >([]);

  // 使用懒加载 Hook
  const { observeElement } = useLazyLoad({
    threshold: 0.1,
    rootMargin: '50px',
  });

  // 计算列数
  useEffect(() => {
    const calculateColumns = () => {
      const width = window.innerWidth;
      if (width >= 1536) return 6; // 2xl: 6列
      if (width >= 1280) return 5; // xl: 5列
      if (width >= 1024) return 4; // lg: 4列
      if (width >= 768) return 3; // md: 3列
      if (width >= 640) return 2; // sm: 2列
      return 2; // 默认2列
    };

    const updateColumns = () => {
      const newColumns = calculateColumns();
      if (newColumns !== columns) {
        setColumns(newColumns);
        setColumnHeights(new Array(newColumns).fill(0));
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [columns]);

  // 初始化列高度
  useEffect(() => {
    if (columnHeights.length === 0 && columns > 0) {
      setColumnHeights(new Array(columns).fill(0));
    }
  }, [columns, columnHeights.length]);

  // 布局图片到列中
  useEffect(() => {
    if (images.length === 0 || columns === 0) {
      setImageElements([]);
      return;
    }

    const newColumnHeights = new Array(columns).fill(0);
    const newImageElements: Array<{
      image: ImageItem;
      index: number;
      height: number;
      column: number;
    }> = [];

    images.forEach((image, index) => {
      // 找到最短的列
      const shortestColumn = newColumnHeights.indexOf(
        Math.min(...newColumnHeights)
      );

      // 计算图片高度（保持宽高比）
      const aspectRatio = image.height / image.width;
      const columnWidth = 100 / columns; // 百分比宽度
      const baseHeight = (window.innerWidth * columnWidth) / 100;
      const imageHeight = baseHeight * aspectRatio;

      newImageElements.push({
        image,
        index,
        height: imageHeight,
        column: shortestColumn,
      });

      newColumnHeights[shortestColumn] += imageHeight + 10; // 10px 间距
    });

    setColumnHeights(newColumnHeights);
    setImageElements(newImageElements);
  }, [images, columns]);

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
    [onImageClick]
  );

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
      <div className={`photo-wall-empty ${className}`}>
        <p>{translate('photoWall.noImages')}</p>
      </div>
    );
  }

  // 按列组织图片
  const columnsData: Array<Array<(typeof imageElements)[0]>> = new Array(
    columns
  )
    .fill(null)
    .map(() => []);

  imageElements.forEach(item => {
    columnsData[item.column].push(item);
  });

  return (
    <>
      <div
        ref={containerRef}
        className={`photo-wall-container photo-wall-fullscreen ${className}`}
      >
        {/* 关闭按钮 */}
        {onClose && (
          <button
            onClick={onClose}
            className="photo-wall-close-button"
            title={translate('common.close')}
          >
            <X className="photo-wall-close-icon" />
          </button>
        )}
        <div
          className="photo-wall-grid"
          style={{ '--columns': columns } as React.CSSProperties}
        >
          {columnsData.map((column, colIndex) => (
            <div key={colIndex} className="photo-wall-column">
              {column.map(({ image, index, height }) => (
                <div
                  key={`${image.id}-${index}`}
                  className="photo-wall-item"
                  style={{ height: `${height}px` }}
                  data-image-index={index}
                >
                  <div
                    className="photo-wall-item-wrapper"
                    onClick={() => handleImageClick(image, index)}
                  >
                    <img
                      ref={el => {
                        if (el) observeElement(el, `${image.id}-${index}`);
                      }}
                      src={image.url}
                      alt={image.name}
                      className="photo-wall-image"
                      loading="lazy"
                      style={{
                        aspectRatio: `${image.width} / ${image.height}`,
                      }}
                      onError={e => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="photo-wall-overlay">
                      <div className="photo-wall-overlay-content">
                        <Eye className="photo-wall-icon" />
                        <span className="photo-wall-name">{image.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
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

export default PhotoWall;
