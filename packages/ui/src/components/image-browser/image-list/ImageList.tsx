import React, { useState, useCallback, useEffect } from 'react';
import { ImageItem } from '../../../types/image';
import {
  Eye,
  Edit,
  Trash2,
  Tag,
  Calendar,
  Link,
  MoreHorizontal,
  HardDrive,
  Loader2,
} from 'lucide-react';
import ImageEditModal from '../components/image-edit/ImageEditModal';
import ImagePreviewModal from '../components/image-preview/ImagePreviewModal';
import ImageUrlModal from '../components/image-url/ImageUrlModal';
import { useLazyLoad, useInfiniteScroll, useEscapeKey } from '../../../hooks';
import {
  showSuccess,
  showError,
  showInfo,
  showLoading,
  updateLoadingToSuccess,
  updateLoadingToError,
} from '../../../utils/toast';
import { defaultTranslate } from '../../../locales/defaultTranslate';
import './ImageList.css';

interface ImageListProps {
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

const ImageList: React.FC<ImageListProps> = ({
  images,
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
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [previewImageIndex, setPreviewImageIndex] = useState<number>(-1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // 滚动加载配置
  const pageSize = 20;
  const initialLoadCount = 15;

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
  const { visibleItems: visibleImages, observeElement } = useLazyLoad({
    threshold: 0.1,
    rootMargin: '50px',
  });

  // 当图片列表变化时重置滚动状态
  useEffect(() => {
    // 确保搜索和过滤变化时重置滚动状态
    reset();
  }, [images, reset]);

  const handleDelete = useCallback(
    async (image: ImageItem) => {
      if (
        confirm(
          `${translate('image.list.confirmDelete')} "${image.name}" ${translate('common.confirm')}？`
        )
      ) {
        if (onDeleteImage) {
          const loadingToast = showLoading(
            `${translate('image.list.deleting')} "${image.name}"...`
          );
          try {
            await onDeleteImage(image.id, image.name);
            updateLoadingToSuccess(
              loadingToast,
              `${translate('image.list.deleteSuccess')} "${image.name}" ${translate('image.list.deleted')}`
            );
          } catch (error) {
            updateLoadingToError(
              loadingToast,
              `${translate('image.list.deleteFailed')} "${image.name}" ${translate('image.list.failed')}: ${error instanceof Error ? error.message : translate('common.unknownError')}`
            );
          }
        }
      }
    },
    [onDeleteImage, translate]
  );

  const handleEdit = useCallback((image: ImageItem) => {
    setSelectedImage(image);
    setShowEditModal(true);
    showInfo(`${translate('image.list.editing')} "${image.name}"`);
  }, []);

  const handlePreview = useCallback(
    (image: ImageItem) => {
      const imageIndex = images.findIndex(img => img.id === image.id);
      setSelectedImage(image);
      setPreviewImageIndex(imageIndex);
      setShowPreview(true);
      showInfo(`${translate('image.list.previewing')} "${image.name}"`);
    },
    [images]
  );

  // 监听预览事件（仅列表视图）
  useEffect(() => {
    const handlePreviewEvent = (event: CustomEvent) => {
      const { image, viewMode } = event.detail;
      // 只在列表视图模式下响应
      if (
        viewMode === 'list' &&
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

  const handleEditSuccess = useCallback((image: ImageItem) => {
    showSuccess(`图片 "${image.name}" 信息已成功更新`);
    setShowEditModal(false);
  }, []);

  const handleEditCancel = useCallback(() => {
    showInfo(translate('image.list.editCancelled'));
    setShowEditModal(false);
  }, []);

  // ESC 键关闭预览和URL模态框
  useEscapeKey(() => {
    if (showPreview) {
      setShowPreview(false);
    } else if (showUrlModal) {
      setShowUrlModal(false);
    }
  }, showPreview || showUrlModal);

  const handleViewUrl = useCallback((image: ImageItem) => {
    setSelectedImage(image);
    setShowUrlModal(true);
    showInfo(`查看图片 "${image.name}" 的在线地址`);
  }, []);

  const handleCopyUrl = useCallback(
    async (url: string, type: 'url' | 'githubUrl') => {
      try {
        await navigator.clipboard.writeText(url);
        showSuccess(
          `${type === 'url' ? '图片地址' : 'GitHub地址'}已复制到剪贴板`
        );
      } catch (error) {
        showError('复制失败，请手动复制');
      }
    },
    []
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

  const toggleRowExpansion = useCallback((imageId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  }, []);

  // 获取图片真实尺寸
  const fetchImageDimensions = useCallback(
    async (image: ImageItem) => {
      if (!getImageDimensionsFromUrl) return;

      try {
        const dimensions = await getImageDimensionsFromUrl(image.url);
        setImageDimensions(prev => ({
          ...prev,
          [image.id]: dimensions,
        }));
      } catch (error) {
        console.warn(`Failed to get dimensions for ${image.name}:`, error);
      }
    },
    [getImageDimensionsFromUrl]
  );

  // 当图片变为可见时获取尺寸
  useEffect(() => {
    visibleImages.forEach(imageId => {
      const image = images.find(img => img.id === imageId);
      if (image && (image.width === 0 || image.height === 0)) {
        fetchImageDimensions(image);
      }
    });
  }, [visibleImages, images, fetchImageDimensions]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  }, []);

  // 渲染单个图片项的函数
  const renderImageItem = useCallback(
    (image: ImageItem, index: number) => {
      const isSelected = selectedImageIndex === index;

      return (
        <div
          key={image.id}
          ref={el => el && observeElement(el, image.id)}
          data-image-index={index}
          onClick={() => onImageSelect?.(index)}
          className={`image-list-item ${isSelected ? 'selected' : 'unselected'}`}
        >
          {/* 主要行 */}
          <div className="px-6 py-4">
            <div className="image-list-main-row">
              <div className="image-list-thumbnail-container">
                <div className="image-list-thumbnail">
                  {visibleImages.has(image.id) ? (
                    <img
                      src={image.url}
                      alt={image.name}
                      className="image-list-thumbnail-image"
                      loading="lazy"
                    />
                  ) : (
                    <div className="image-list-thumbnail-placeholder">
                      <div className="image-loading-spinner"></div>
                    </div>
                  )}
                </div>
                {/* 选中指示器 */}
                {isSelected && (
                  <div className="image-list-selected-badge">✓</div>
                )}
              </div>

              <div className="image-list-main-content">
                <div className="image-list-info-row">
                  <h3
                    className={`image-list-title ${isSelected ? 'selected' : 'unselected'}`}
                  >
                    {image.name}
                    {isSelected && (
                      <span className="image-list-selected-indicator">
                        {translate('image.list.selected')}
                      </span>
                    )}
                  </h3>
                  {image.tags.length > 0 && (
                    <div className="image-list-tags">
                      {image.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={`${image.id}-tag-${index}`}
                          className="image-list-tag image-list-tag-primary"
                        >
                          {tag}
                        </span>
                      ))}
                      {image.tags.length > 2 && (
                        <span className="image-list-tag image-list-tag-secondary">
                          +{image.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {image.description && (
                  <p className="image-list-description">{image.description}</p>
                )}

                <div className="image-list-meta">
                  <span className="image-list-meta-item">
                    <Calendar className="image-list-meta-icon" />
                    {formatDate(image.createdAt)}
                  </span>
                  <span className="image-list-meta-item">
                    {(() => {
                      const dimensions = imageDimensions[image.id];
                      if (dimensions) {
                        return `${dimensions.width} × ${dimensions.height}`;
                      } else if (image.width > 0 && image.height > 0) {
                        return `${image.width} × ${image.height}`;
                      } else {
                        return translate('image.list.gettingDimensions');
                      }
                    })()}
                  </span>
                  {image.size > 0 && (
                    <span className="image-list-meta-item">
                      <HardDrive className="image-list-meta-icon" />
                      <span>{formatFileSize(image.size)}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="image-list-actions">
                <button
                  onClick={() => handlePreview(image)}
                  className="image-list-action-button"
                  title={translate('image.list.preview')}
                >
                  <Eye className="image-list-action-icon" />
                </button>
                <button
                  onClick={() => handleEdit(image)}
                  className="image-list-action-button"
                  title={translate('image.list.edit')}
                >
                  <Edit className="image-list-action-icon" />
                </button>
                <button
                  onClick={() => toggleRowExpansion(image.id)}
                  className="image-list-action-button"
                  title={translate('image.list.moreActions')}
                >
                  <MoreHorizontal className="image-list-action-icon" />
                </button>
              </div>
            </div>
          </div>

          {/* 展开行 - 更多操作和压缩结果 */}
          {expandedRows.has(image.id) && (
            <div className="image-list-expanded">
              <div className="image-list-expanded-content">
                <div className="image-list-expanded-actions">
                  <button
                    onClick={() => handleViewUrl(image)}
                    className="image-list-secondary-button"
                  >
                    <Link className="image-list-button-icon" />
                    {translate('image.list.viewUrl')}
                  </button>
                  <button
                    onClick={() => handleDelete(image)}
                    className="image-list-secondary-button image-list-delete-button"
                  >
                    <Trash2 className="image-list-button-icon" />
                    {translate('image.list.delete')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    },
    [
      selectedImageIndex,
      onImageSelect,
      observeElement,
      visibleImages,
      formatDate,
      imageDimensions,
      handlePreview,
      handleEdit,
      toggleRowExpansion,
      expandedRows,
      handleViewUrl,
      handleDelete,
    ]
  );

  if (images.length === 0) {
    return (
      <div className="image-list-empty">
        <div className="image-list-empty-content">
          <div className="image-list-empty-icon">
            <Tag className="image-list-empty-icon-svg" />
          </div>
          <h3 className="image-list-empty-title">
            {translate('image.list.emptyTitle')}
          </h3>
          <p className="image-list-empty-description">
            {translate('image.list.emptyDescription')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 列表头部 */}
      <div className="image-list-header">
        <div className="image-list-header-content">
          <h2 className="image-list-header-title">图片列表</h2>
          <div className="image-list-header-count">
            共 {images.length} 张图片
          </div>
        </div>
      </div>

      {/* 列表内容 */}
      <div className="image-list-content">
        <div ref={containerRef} className="image-list-scroll-container">
          {visibleItems.map((image, index) => renderImageItem(image, index))}

          {/* 加载更多指示器 */}
          {hasMore && (
            <div ref={loadingRef} className="image-list-loading">
              {isLoading ? (
                <div className="image-list-loading-content">
                  <Loader2 className="image-list-loading-spinner" />
                  <span>{translate('image.list.loadingMore')}</span>
                </div>
              ) : (
                <button
                  onClick={loadMore}
                  className="image-list-load-more-button"
                >
                  {translate('image.list.loadMore')}
                </button>
              )}
            </div>
          )}

          {/* 已加载全部提示 */}
          {!hasMore && visibleItems.length > 0 && (
            <div className="image-list-all-loaded">
              <p>已加载全部 {visibleItems.length} 张图片</p>
            </div>
          )}

          {/* 空状态 */}
          {visibleItems.length === 0 && !isLoading && (
            <div className="image-list-no-images">
              <p>暂无图片</p>
            </div>
          )}
        </div>
      </div>

      {/* 编辑模态框 */}
      {showEditModal && selectedImage && onUpdateImage && (
        <ImageEditModal
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
        imageDimensions={imageDimensions}
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
        imageDimensions={imageDimensions}
        onCopyUrl={handleCopyUrl}
        onOpenUrl={handleOpenUrl}
        t={translate}
      />
    </>
  );
};

export default ImageList;
