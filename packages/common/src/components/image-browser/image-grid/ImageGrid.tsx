import {
  Calendar,
  Edit,
  Eye,
  HardDrive,
  Link,
  Loader2,
  Trash2,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEscapeKey, useInfiniteScroll, useLazyLoad } from '../../../hooks';
import { defaultTranslate } from '../../../locales';
import { ImageItem } from '../../../types/image';
import {
  showError,
  showInfo,
  showLoading,
  showSuccess,
  updateLoadingToError,
  updateLoadingToSuccess,
} from '../../../utils/toast';
import ImageEditModal from '../components/image-edit/ImageEditModal';
import ImagePreviewModal from '../components/image-preview/ImagePreviewModal';
import ImageUrlModal from '../components/image-url/ImageUrlModal';
import './ImageGrid.css';

interface ImageGridProps {
  images: ImageItem[];
  className?: string;
  selectedImageIndex?: number;
  onImageSelect?: (index: number) => void;
  onDeleteImage?: (id: string, name: string) => Promise<void>;
  onUpdateImage?: (data: any) => Promise<void>;
  getImageDimensionsFromUrl?: (
    url: string
  ) => Promise<{ width: number; height: number }>;
  formatFileSize?: (size: number) => string;
  t?: (key: string) => string;
}

const ImageGridComponent: React.FC<ImageGridProps> = ({
  images,
  className = '',
  selectedImageIndex = -1,
  onImageSelect,
  onDeleteImage,
  onUpdateImage,
  getImageDimensionsFromUrl,
  formatFileSize = (size: number) => `${(size / 1024 / 1024).toFixed(2)} MB`,
  t,
}) => {
  // 使用传入的翻译函数或默认中文翻译函数
  const translate = t || defaultTranslate;
  // 滚动加载配置
  const pageSize = 20;
  const initialLoadCount = 12;
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [previewImageIndex, setPreviewImageIndex] = useState<number>(-1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);

  // 使用无限滚动Hook
  const {
    visibleItems,
    hasMore,
    isLoading,
    loadMore,
    reset,
    containerRef,
    loadingRef,
  } = useInfiniteScroll(images, {
    pageSize,
    initialLoadCount,
    threshold: 0.1,
    rootMargin: '200px',
  });

  // 使用懒加载 Hook
  const { observeElement } = useLazyLoad({
    threshold: 0.1,
    rootMargin: '50px',
  });

  // 使用 useRef 跟踪上一次的图片列表，只在真正变化时重置
  const prevImagesRef = useRef<ImageItem[]>([]);
  const prevImagesIdsRef = useRef<string>('');

  // 当图片列表变化时重置滚动状态
  useEffect(() => {
    // 生成当前图片列表的ID字符串
    const currentImagesIds = images.map(img => img.id).join(',');

    // 只在图片列表真正变化时重置（通过ID比较，避免引用变化导致的重复重置）
    if (prevImagesIdsRef.current !== currentImagesIds) {
      prevImagesIdsRef.current = currentImagesIds;
      prevImagesRef.current = images;
      reset();
    }
  }, [images, reset]);

  // 获取图片尺寸显示文本
  const getDimensionsText = useCallback(
    (image: ImageItem): string => {
      // 直接使用元数据中的尺寸
      if (image.width > 0 && image.height > 0) {
        return `${image.width} × ${image.height}`;
      }
      // 如果没有尺寸数据或尺寸数据不合法，显示暂无尺寸数据
      return translate('image.grid.dimensionsUnknown');
    },
    [translate]
  );

  const handleDelete = useCallback(
    async (image: ImageItem) => {
      if (
        confirm(
          `${translate('image.grid.confirmDelete')} "${image.name}" ${translate('common.confirm')}？`
        )
      ) {
        if (onDeleteImage) {
          const loadingToast = showLoading(
            `${translate('image.grid.deleting')} "${image.name}"...`,
            {
              getMessage: () =>
                `${translate('image.grid.deleting')} "${image.name}"...`,
            }
          );
          try {
            await onDeleteImage(image.id, image.name);
            updateLoadingToSuccess(
              String(loadingToast),
              `${translate('image.grid.deleteSuccess')} "${image.name}" ${translate('image.grid.deleted')}`,
              {
                getMessage: () =>
                  `${translate('image.grid.deleteSuccess')} "${image.name}" ${translate('image.grid.deleted')}`,
              }
            );
          } catch (error) {
            updateLoadingToError(
              String(loadingToast),
              `${translate('image.grid.deleteFailed')} "${image.name}" ${translate('image.grid.failed')}: ${error instanceof Error ? error.message : translate('common.unknownError')}`,
              {
                getMessage: () =>
                  `${translate('image.grid.deleteFailed')} "${image.name}" ${translate('image.grid.failed')}: ${error instanceof Error ? error.message : translate('common.unknownError')}`,
              }
            );
          }
        }
      }
    },
    [onDeleteImage, translate]
  );

  const handleEdit = useCallback(
    (image: ImageItem) => {
      setSelectedImage(image);
      setShowEditModal(true);
      showInfo(`${translate('image.grid.editing')} "${image.name}"`, {
        getMessage: () => `${translate('image.grid.editing')} "${image.name}"`,
      });
    },
    [translate]
  );

  const handlePreview = useCallback(
    (image: ImageItem) => {
      const imageIndex = images.findIndex(img => img.id === image.id);
      setSelectedImage(image);
      setPreviewImageIndex(imageIndex);
      setShowPreview(true);
      showInfo(`${translate('image.grid.previewing')} "${image.name}"`, {
        getMessage: () =>
          `${translate('image.grid.previewing')} "${image.name}"`,
      });
    },
    [images, translate]
  );

  // 监听预览事件（仅网格视图）
  useEffect(() => {
    const handlePreviewEvent = (event: CustomEvent) => {
      const { image, viewMode } = event.detail;
      // 只在网格视图模式下响应
      if (
        viewMode === 'grid' &&
        image &&
        images.find(img => img.id === image.id)
      ) {
        handlePreview(image);
      }
    };

    window.addEventListener(
      'previewImage',
      handlePreviewEvent as EventListener
    );
    return () => {
      window.removeEventListener(
        'previewImage',
        handlePreviewEvent as EventListener
      );
    };
  }, [handlePreview, images]);

  const handleEditSuccess = useCallback(
    (updatedImage: ImageItem) => {
      showSuccess(
        translate('image.grid.updateSuccessMessage').replace(
          '{name}',
          updatedImage.name
        ),
        {
          getMessage: () =>
            translate('image.grid.updateSuccessMessage').replace(
              '{name}',
              updatedImage.name
            ),
        }
      );
      // 更新选中的图片数据
      setSelectedImage(updatedImage);
      setShowEditModal(false);

      // 添加小延迟后刷新显示（确保异步更新完成）
      setTimeout(() => {
        // 强制重新渲染，这会触发组件重新从 images prop 中获取最新数据
        setSelectedImage(prev => {
          if (prev && prev.id === updatedImage.id) {
            return updatedImage;
          }
          return prev;
        });
      }, 100);
    },
    [translate]
  );

  const handleEditCancel = useCallback(() => {
    showInfo(translate('image.grid.editCancelled'), {
      messageKey: 'image.grid.editCancelled',
    });
    setShowEditModal(false);
  }, [translate]);

  // ESC 键关闭预览和URL模态框
  useEscapeKey(() => {
    if (showPreview) {
      setShowPreview(false);
    } else if (showUrlModal) {
      setShowUrlModal(false);
    }
  }, showPreview || showUrlModal);

  const handleViewUrl = useCallback(
    (image: ImageItem) => {
      setSelectedImage(image);
      setShowUrlModal(true);
      showInfo(
        translate('image.grid.viewUrlMessage').replace('{name}', image.name),
        {
          getMessage: () =>
            translate('image.grid.viewUrlMessage').replace(
              '{name}',
              image.name
            ),
        }
      );
    },
    [translate]
  );

  const handleCopyUrl = useCallback(
    async (url: string, type: 'url' | 'githubUrl') => {
      try {
        await navigator.clipboard.writeText(url);
        const urlTypeText =
          type === 'url'
            ? translate('image.grid.imageUrlCopied')
            : translate('image.grid.githubUrlCopied');
        showSuccess(
          `${urlTypeText}${translate('image.grid.copiedToClipboard')}`,
          {
            getMessage: () => {
              const currentUrlTypeText =
                type === 'url'
                  ? translate('image.grid.imageUrlCopied')
                  : translate('image.grid.githubUrlCopied');
              return `${currentUrlTypeText}${translate('image.grid.copiedToClipboard')}`;
            },
          }
        );
      } catch (error) {
        showError(translate('image.grid.copyFailed'), {
          messageKey: 'image.grid.copyFailed',
        });
      }
    },
    [translate]
  );

  const handleOpenUrl = useCallback((url: string) => {
    window.open(url, '_blank');
  }, []);

  // 预览导航处理
  const handlePreviewNavigate = useCallback(
    (newIndex: number) => {
      if (newIndex >= 0 && newIndex < images.length) {
        const newImage = images[newIndex];
        setSelectedImage(newImage);
        setPreviewImageIndex(newIndex);
      }
    },
    [images]
  );

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  }, []);

  // 渲染单个图片项
  const renderImageItem = useCallback(
    (image: ImageItem, index: number) => {
      const isSelected = selectedImageIndex === index;

      return (
        <div
          key={image.id}
          ref={el => {
            if (el) {
              observeElement(el, image.id);
            }
          }}
          data-image-index={index}
          onClick={() => onImageSelect?.(index)}
          className={`image-browser-item ${isSelected ? 'selected' : 'unselected'}`}
        >
          {/* 图片预览 - 懒加载 */}
          <div className="image-grid-preview">
            {/* 选中指示器 */}
            {isSelected && (
              <div className="image-grid-selected-indicator">✓</div>
            )}
            <img
              src={image.url}
              alt={image.name}
              className="image-grid-image"
              loading="lazy"
              onClick={e => {
                e.stopPropagation();
                onImageSelect?.(index);
              }}
            />

            {/* 操作按钮 */}
            <div
              className="image-grid-overlay"
              onClick={e => e.stopPropagation()}
            >
              <div className="image-grid-actions">
                <button
                  onClick={() => handlePreview(image)}
                  className="image-action-button"
                  title={translate('image.grid.preview')}
                >
                  <Eye className="image-action-icon" />
                </button>
                <button
                  onClick={() => handleViewUrl(image)}
                  className="image-action-button"
                  title={translate('image.grid.viewUrl')}
                >
                  <Link className="image-action-icon" />
                </button>
                <button
                  onClick={() => handleEdit(image)}
                  className="image-action-button"
                  title={translate('image.grid.edit')}
                >
                  <Edit className="image-action-icon" />
                </button>
                <button
                  onClick={() => handleDelete(image)}
                  className="image-action-button"
                  title={translate('image.grid.delete')}
                >
                  <Trash2 className="image-action-icon" />
                </button>
              </div>
            </div>
          </div>

          {/* 图片信息 */}
          <div
            className="image-info-section"
            onClick={e => {
              e.stopPropagation();
              onImageSelect?.(index);
            }}
          >
            <div className="image-info-content">
              <h3 className="image-grid-title">{image.name}</h3>

              {image.description && (
                <p className="image-grid-description">{image.description}</p>
              )}
            </div>

            <div className="image-info-footer">
              {/* 标签 */}
              {image.tags.length > 0 && (
                <div className="image-grid-tags">
                  {image.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={`${image.id}-tag-${index}`}
                      className="image-tag image-tag-primary"
                    >
                      {tag}
                    </span>
                  ))}
                  {image.tags.length > 3 && (
                    <span className="image-tag image-tag-secondary">
                      +{image.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* 图片详情 */}
              <div className="image-grid-meta">
                <span className="image-grid-dimensions">
                  {getDimensionsText(image)}
                </span>
                {image.size > 0 && (
                  <span className="image-grid-size">
                    <HardDrive className="image-grid-meta-icon" />
                    <span>{formatFileSize(image.size)}</span>
                  </span>
                )}
              </div>

              <div className="image-grid-date">
                <Calendar className="image-grid-meta-icon" />
                <span>{formatDate(image.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    },
    [
      getDimensionsText,
      handlePreview,
      handleViewUrl,
      handleEdit,
      handleDelete,
      formatDate,
      observeElement,
      selectedImageIndex,
      onImageSelect,
    ]
  );

  return (
    <>
      {/* 滚动容器 */}
      <div ref={containerRef} className={`image-grid-container ${className}`}>
        {/* 图片网格 */}
        <div className="image-grid">
          {visibleItems.map((image, index) => renderImageItem(image, index))}
        </div>

        {/* 加载更多指示器 */}
        {hasMore && (
          <div ref={loadingRef} className="image-grid-loading">
            {isLoading ? (
              <div className="image-grid-loading-content">
                <Loader2 className="image-grid-loading-spinner" />
                <span>{translate('image.grid.loadingMore')}</span>
              </div>
            ) : (
              <button
                onClick={loadMore}
                className="image-grid-load-more-button"
              >
                {translate('image.grid.loadMore')}
              </button>
            )}
          </div>
        )}

        {/* 已加载全部提示 */}
        {!hasMore && visibleItems.length > 0 && (
          <div className="image-grid-all-loaded">
            <p>
              {translate('image.grid.allLoaded')} {visibleItems.length}{' '}
              {translate('image.grid.images')}
            </p>
          </div>
        )}

        {/* 空状态 */}
        {visibleItems.length === 0 && !isLoading && (
          <div className="image-grid-empty">
            <p>{translate('image.grid.noImages')}</p>
          </div>
        )}
      </div>

      {/* 编辑模态框 */}
      {showEditModal && selectedImage && onUpdateImage && (
        <ImageEditModal
          t={translate}
          image={selectedImage}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdateImage={onUpdateImage}
          onSuccess={handleEditSuccess}
          onCancel={handleEditCancel}
          getImageDimensionsFromUrl={getImageDimensionsFromUrl}
        />
      )}

      {/* 预览模态框 */}
      <ImagePreviewModal
        image={selectedImage}
        images={images}
        currentIndex={previewImageIndex}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onNavigate={handlePreviewNavigate}
        formatFileSize={formatFileSize}
        onCopyUrl={handleCopyUrl}
        onOpenUrl={handleOpenUrl}
        t={translate}
      />

      {/* 在线地址模态框 */}
      <ImageUrlModal
        image={selectedImage}
        isOpen={showUrlModal}
        onClose={() => setShowUrlModal(false)}
        onCopyUrl={handleCopyUrl}
        onOpenUrl={handleOpenUrl}
        t={translate}
      />
    </>
  );
};

// 使用 React.memo 优化，避免不必要的重新渲染
// 比较函数返回 true 表示 props 相同（不需要重新渲染），false 表示不同（需要重新渲染）
const ImageGrid = React.memo(ImageGridComponent, (prevProps, nextProps) => {
  // 快速路径：如果引用相同，直接返回 true
  if (prevProps.images === nextProps.images) {
    // 即使引用相同，也要检查其他可能变化的 props
    return (
      prevProps.selectedImageIndex === nextProps.selectedImageIndex &&
      prevProps.className === nextProps.className
    );
  }

  // 比较 images 数组：通过 ID 序列和顺序比较
  if (prevProps.images.length !== nextProps.images.length) {
    return false; // 长度不同，需要重新渲染
  }

  // 比较 ID 序列（包括顺序）
  for (let i = 0; i < prevProps.images.length; i++) {
    if (prevProps.images[i].id !== nextProps.images[i].id) {
      return false; // ID 序列或顺序不同，需要重新渲染
    }
  }

  // 其他 props 比较
  if (
    prevProps.selectedImageIndex !== nextProps.selectedImageIndex ||
    prevProps.className !== nextProps.className
  ) {
    return false;
  }

  // props 相同，不需要重新渲染
  return true;
});

ImageGrid.displayName = 'ImageGrid';

export default ImageGrid;
