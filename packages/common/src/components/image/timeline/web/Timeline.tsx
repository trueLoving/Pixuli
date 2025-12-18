import { Eye, X } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLazyLoad } from '../../../../hooks';
import { defaultTranslate } from '../../../../locales';
import { ImageItem } from '../../../../types/image';
import { ImagePreviewModal } from '../../image-preview-modal/web';
import './Timeline.css';

interface TimelineProps {
  images: ImageItem[];
  className?: string;
  onImageClick?: (image: ImageItem, index: number) => void;
  onClose?: () => void;
  t?: (key: string) => string;
}

interface GroupedImage {
  image: ImageItem;
  index: number;
  date: Date;
  dateStr: string;
  dayOfWeek: string;
}

const Timeline: React.FC<TimelineProps> = ({
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
  const timelineRef = useRef<HTMLDivElement>(null);

  // 使用懒加载 Hook
  const { observeElement } = useLazyLoad({
    threshold: 0.1,
    rootMargin: '50px',
  });

  // 格式化日期为中文格式：月日 + 星期
  const formatDate = useCallback((date: Date): string => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = date.getDay();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${month}月${day}日${weekdays[dayOfWeek]}`;
  }, []);

  // 按日期分组图片
  const groupedImages = useMemo(() => {
    if (images.length === 0) return [];

    const grouped: GroupedImage[] = images.map((image, index) => {
      const date = new Date(image.createdAt);
      return {
        image,
        index,
        date,
        dateStr: formatDate(date),
        dayOfWeek: formatDate(date),
      };
    });

    // 按日期倒序排列（最新的在前）
    return grouped.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [images, formatDate]);

  // 获取所有年份
  const years = useMemo(() => {
    const yearSet = new Set<number>();
    groupedImages.forEach(item => {
      yearSet.add(item.date.getFullYear());
    });
    return Array.from(yearSet).sort((a, b) => b - a); // 倒序排列
  }, [groupedImages]);

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

  // 导航预览
  const handleNavigatePreview = useCallback((index: number) => {
    setPreviewImageIndex(index);
  }, []);

  // 关闭预览
  const handleClosePreview = useCallback(() => {
    setShowPreview(false);
    setPreviewImageIndex(-1);
  }, []);

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC 键关闭时间线
      if (event.key === 'Escape' && !showPreview && onClose) {
        onClose();
      }
      // ESC 键关闭预览
      if (event.key === 'Escape' && showPreview) {
        handleClosePreview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, showPreview, handleClosePreview]);

  // 计算年份标记的位置（基于照片的实际分布）
  const yearPositions = useMemo(() => {
    if (years.length === 0 || groupedImages.length === 0) return {};

    const positions: Record<number, number> = {};
    const photosContainer =
      containerRef.current?.querySelector('.timeline-photos');
    if (!photosContainer) return positions;

    years.forEach(year => {
      // 找到该年份的第一张照片
      const firstImageOfYear = groupedImages.find(
        item => item.date.getFullYear() === year,
      );
      if (firstImageOfYear) {
        // 计算该照片在列表中的索引位置（作为百分比）
        const index = groupedImages.indexOf(firstImageOfYear);
        positions[year] = (index / groupedImages.length) * 100;
      }
    });

    return positions;
  }, [years, groupedImages]);

  if (images.length === 0) {
    return (
      <div className={`timeline-container timeline-fullscreen ${className}`}>
        <div className="timeline-header">
          <div className="timeline-count">0 {translate('app.images')}</div>
          {onClose && (
            <button
              onClick={onClose}
              className="timeline-close-button"
              title={translate('common.close')}
            >
              <X className="timeline-close-icon" />
            </button>
          )}
        </div>
        <div className="timeline-empty">
          <p>{translate('timeline.noImages')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`timeline-container timeline-fullscreen ${className}`}
      >
        {/* 头部：图片数量和关闭按钮 */}
        <div className="timeline-header">
          <div className="timeline-count">
            {images.length} {translate('app.images')}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="timeline-close-button"
              title={translate('common.close')}
            >
              <X className="timeline-close-icon" />
            </button>
          )}
        </div>

        {/* 主内容区域 */}
        <div className="timeline-content">
          {/* 照片网格 */}
          <div className="timeline-photos">
            {groupedImages.map(({ image, index, dateStr }) => (
              <div
                key={`${image.id}-${index}`}
                className="timeline-photo-item"
                data-image-index={index}
              >
                <div
                  className="timeline-photo-wrapper"
                  onClick={() => handleImageClick(image, index)}
                >
                  <img
                    ref={el => {
                      if (el) observeElement(el, `${image.id}-${index}`);
                    }}
                    src={image.url}
                    alt={image.name}
                    className="timeline-photo-image"
                    loading="lazy"
                    style={{
                      aspectRatio: `${image.width} / ${image.height}`,
                    }}
                    onError={e => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div className="timeline-photo-overlay">
                    <div className="timeline-photo-overlay-content">
                      <Eye className="timeline-photo-icon" />
                      <span className="timeline-photo-name">{image.name}</span>
                    </div>
                  </div>
                </div>
                <div className="timeline-photo-date">{dateStr}</div>
              </div>
            ))}
          </div>

          {/* 右侧时间轴 */}
          <div ref={timelineRef} className="timeline-axis">
            <div className="timeline-line" />
            {years.map(year => (
              <div
                key={year}
                className="timeline-year-marker"
                style={{
                  top: `${yearPositions[year] || 0}%`,
                }}
              >
                <div className="timeline-year-dot" />
                <div className="timeline-year-label">{year}</div>
              </div>
            ))}
          </div>
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

export default Timeline;
