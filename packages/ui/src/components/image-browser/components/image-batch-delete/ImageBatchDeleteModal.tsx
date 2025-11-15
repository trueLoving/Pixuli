import { CheckSquare, Loader2, Square, Trash2, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { defaultTranslate } from '../../../../locales';
import type { ImageItem } from '../../../../types/image';
import {
  showLoading,
  updateLoadingToError,
  updateLoadingToSuccess,
} from '../../../../utils/toast';
import './ImageBatchDeleteModal.css';

interface BatchDeleteModalProps {
  images: ImageItem[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (imageIds: string[], fileNames: string[]) => Promise<void>;
  t?: (key: string) => string;
}

const BatchDeleteModal: React.FC<BatchDeleteModalProps> = ({
  images,
  isOpen,
  onClose,
  onConfirm,
  t,
}) => {
  const translate = t || defaultTranslate;
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(
    new Set()
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // 重置选择状态和删除状态
  useEffect(() => {
    if (isOpen) {
      setSelectedImageIds(new Set());
      setIsDeleting(false);
    }
  }, [isOpen]);

  // 切换单个图片的选择状态
  const handleToggleImageSelection = useCallback((imageId: string) => {
    setSelectedImageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  }, []);

  // 全选/取消全选
  const handleSelectAll = useCallback(() => {
    if (selectedImageIds.size === images.length) {
      // 取消全选
      setSelectedImageIds(new Set());
    } else {
      // 全选
      setSelectedImageIds(new Set(images.map(img => img.id)));
    }
  }, [images, selectedImageIds.size]);

  // 确认删除
  const handleConfirm = useCallback(async () => {
    if (selectedImageIds.size === 0 || isDeleting) {
      return;
    }

    const selectedImages = images.filter(img => selectedImageIds.has(img.id));
    const ids = selectedImages.map(img => img.id);
    const names = selectedImages.map(img => img.name);

    setIsDeleting(true);

    // 显示删除中的提示
    const loadingToast = showLoading(
      `正在删除 ${selectedImageIds.size} 张图片...`,
      {
        getMessage: () => `正在删除 ${selectedImageIds.size} 张图片...`,
      }
    );

    try {
      await onConfirm(ids, names);

      // 删除成功
      updateLoadingToSuccess(
        String(loadingToast),
        `成功删除 ${selectedImageIds.size} 张图片`,
        {
          getMessage: () => `成功删除 ${selectedImageIds.size} 张图片`,
        }
      );

      // 关闭模态框
      onClose();
    } catch (error) {
      // 删除失败
      const errorMessage =
        error instanceof Error ? error.message : '批量删除失败，请重试';
      updateLoadingToError(String(loadingToast), `删除失败: ${errorMessage}`, {
        getMessage: () => `删除失败: ${errorMessage}`,
      });
    } finally {
      setIsDeleting(false);
    }
  }, [selectedImageIds, images, onConfirm, onClose, isDeleting]);

  // ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="image-batch-delete-modal-overlay" onClick={onClose}>
      <div
        className="image-batch-delete-modal-container"
        onClick={e => e.stopPropagation()}
      >
        <div className="image-batch-delete-modal-header">
          <h3 className="image-batch-delete-modal-title">批量删除图片</h3>
          <button
            onClick={onClose}
            className="image-batch-delete-modal-close"
            title={translate('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="image-batch-delete-modal-content">
          {/* 操作栏 */}
          <div className="image-batch-delete-modal-toolbar">
            <button
              type="button"
              onClick={handleSelectAll}
              className="image-batch-delete-modal-select-all"
              disabled={isDeleting}
            >
              {selectedImageIds.size === images.length ? '取消全选' : '全选'}
            </button>
            <span className="image-batch-delete-modal-count">
              已选择: {selectedImageIds.size} / {images.length}
            </span>
          </div>

          {/* 图片列表 */}
          <div className="image-batch-delete-modal-image-list">
            {images.length === 0 ? (
              <div className="image-batch-delete-modal-empty">
                <p>没有图片可删除</p>
              </div>
            ) : (
              images.map(image => {
                const isChecked = selectedImageIds.has(image.id);
                return (
                  <div
                    key={image.id}
                    className={`image-batch-delete-modal-image-item ${isChecked ? 'checked' : ''} ${isDeleting ? 'disabled' : ''}`}
                    onClick={() =>
                      !isDeleting && handleToggleImageSelection(image.id)
                    }
                  >
                    <div className="image-batch-delete-modal-checkbox">
                      {isChecked ? (
                        <CheckSquare
                          style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            color: '#3b82f6',
                          }}
                        />
                      ) : (
                        <Square
                          style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            color: '#9ca3af',
                          }}
                        />
                      )}
                    </div>
                    <img
                      src={image.url}
                      alt={image.name}
                      className="image-batch-delete-modal-thumbnail"
                    />
                    <div className="image-batch-delete-modal-image-info">
                      <p className="image-batch-delete-modal-image-name">
                        {image.name}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="image-batch-delete-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="image-batch-delete-modal-cancel"
            disabled={isDeleting}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedImageIds.size === 0 || isDeleting}
            className="image-batch-delete-modal-confirm"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                删除中...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                删除选中 ({selectedImageIds.size})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchDeleteModal;
