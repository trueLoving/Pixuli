import { Save, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { defaultTranslate } from '../../../../../locales';
import type { ImageEditData, ImageItem } from '../../../../../types/image';
import {
  showLoading,
  updateLoadingToError,
  updateLoadingToSuccess,
} from '../../../../../utils/toast';
import './ImageEditModal.css';

interface ImageEditModalProps {
  image: ImageItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdateImage: (data: ImageEditData) => Promise<void>;
  onSuccess?: (image: ImageItem) => void;
  onCancel?: () => void;
  loading?: boolean;
  getImageDimensionsFromUrl?: (
    url: string,
  ) => Promise<{ width: number; height: number }>;
  t?: (key: string) => string;
}

const ImageEditModal: React.FC<ImageEditModalProps> = ({
  image,
  isOpen,
  onClose,
  onUpdateImage,
  onSuccess,
  onCancel,
  loading = false,
  getImageDimensionsFromUrl,
  t,
}) => {
  // 使用传入的翻译函数或默认中文翻译函数
  const translate = t || defaultTranslate;
  const [formData, setFormData] = useState<ImageEditData>({
    id: image.id,
    name: image.name,
    description: image.description || '',
    tags: image.tags || [],
  });
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // ESC 键关闭编辑模态框
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = showLoading(
      `${translate('image.edit.updating')} "${image.name}" ${translate('common.info')}...`,
    );
    try {
      await onUpdateImage(formData);
      updateLoadingToSuccess(
        loadingToast,
        `${translate('image.edit.updateSuccess')} "${image.name}" ${translate('common.info')}${translate('messages.configSaved')}`,
      );
      if (onSuccess) {
        // 构建更新后的图片数据
        const updatedImage = {
          ...image,
          id: formData.name || image.id,
          name: formData.name || image.name,
          description: formData.description || image.description,
          tags: formData.tags || image.tags,
          updatedAt: new Date().toISOString(),
        };
        onSuccess(updatedImage);
      } else {
        onClose();
      }
    } catch (error) {
      updateLoadingToError(
        loadingToast,
        `${translate('image.edit.updateFailed')}: ${error instanceof Error ? error.message : translate('common.error')}`,
      );
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const handleInputChange = (
    field: keyof ImageEditData,
    value: string | string[],
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 当模态框打开或图片更新时，更新表单数据
  useEffect(() => {
    if (isOpen && image) {
      setFormData({
        id: image.id,
        name: image.name,
        description: image.description || '',
        tags: image.tags || [],
      });
      // 清空标签输入框
      if (tagInputRef.current) {
        tagInputRef.current.value = '';
      }
    }
  }, [isOpen, image]);

  // 获取图片真实尺寸
  useEffect(() => {
    if (
      isOpen &&
      image &&
      getImageDimensionsFromUrl &&
      (image.width === 0 || image.height === 0)
    ) {
      getImageDimensionsFromUrl(image.url)
        .then(dimensions => {
          setImageDimensions(dimensions);
        })
        .catch(error => {
          console.warn(`Failed to get dimensions for ${image.name}:`, error);
        });
    }
  }, [isOpen, image, getImageDimensionsFromUrl]);

  if (!isOpen) return null;

  return (
    <div className="image-edit-modal-overlay">
      <div className="image-edit-modal-content">
        <div className="image-edit-modal-header">
          <h2 className="image-edit-modal-title">
            {translate('image.edit.title')}
          </h2>
          <button onClick={onClose} className="image-edit-modal-close">
            <X className="image-edit-modal-close-icon" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 图片预览 */}
          <div className="image-edit-file-info">
            <img
              src={image.url}
              alt={image.name}
              className="image-edit-file-thumbnail"
            />
            <div className="image-edit-file-details">
              <p className="image-edit-file-name">{image.name}</p>
              <p className="image-edit-file-size">
                {translate('image.edit.dimensions')}:{' '}
                {(() => {
                  if (imageDimensions) {
                    return `${imageDimensions.width} × ${imageDimensions.height}`;
                  } else if (image.width > 0 && image.height > 0) {
                    return `${image.width} × ${image.height}`;
                  } else {
                    return translate('image.edit.gettingDimensions');
                  }
                })()}
              </p>
            </div>
          </div>

          <div className="image-edit-form-group">
            <label className="image-edit-form-label">
              {translate('image.edit.imageName')}{' '}
            </label>
            <input
              disabled={true}
              type="text"
              value={formData.name || ''}
              onChange={e => handleInputChange('name', e.target.value)}
              placeholder={translate('image.edit.namePlaceholder')}
              className="image-edit-form-input"
            />
          </div>

          <div className="image-edit-form-group">
            <label className="image-edit-form-label">
              {translate('image.edit.imageDescription')}{' '}
              <span className="image-edit-form-optional">
                {translate('image.edit.optional')}
              </span>
            </label>
            <textarea
              value={formData.description || ''}
              onChange={e => handleInputChange('description', e.target.value)}
              placeholder={translate('image.edit.descriptionPlaceholder')}
              rows={3}
              className="image-edit-form-textarea"
            />
          </div>

          <div className="image-edit-form-group">
            <label className="image-edit-form-label">
              {translate('image.edit.tags')}{' '}
              <span className="image-edit-form-optional">
                {translate('image.edit.optional')}
              </span>
            </label>
            {/* 标签显示区域 */}
            {formData.tags && formData.tags.length > 0 && (
              <div className="image-edit-tags-container">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="image-edit-tag">
                    {tag}
                    <button
                      type="button"
                      onClick={() => {
                        const newTags =
                          formData.tags?.filter((_, i) => i !== index) || [];
                        handleInputChange('tags', newTags);
                      }}
                      className="image-edit-tag-remove"
                      aria-label={`删除标签 ${tag}`}
                    >
                      <X className="image-edit-tag-remove-icon" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {/* 标签输入框 */}
            <input
              ref={tagInputRef}
              type="text"
              onChange={e => {
                const value = e.target.value;
                // 如果输入包含逗号，自动添加标签
                if (value.includes(',')) {
                  const newTags = value
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(Boolean);
                  const existingTags = formData.tags || [];
                  const uniqueNewTags = newTags.filter(
                    tag => !existingTags.includes(tag),
                  );
                  if (uniqueNewTags.length > 0) {
                    handleInputChange('tags', [
                      ...existingTags,
                      ...uniqueNewTags,
                    ]);
                  }
                  if (tagInputRef.current) {
                    tagInputRef.current.value = '';
                  }
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  const value = e.currentTarget.value.trim();
                  if (value) {
                    const existingTags = formData.tags || [];
                    if (!existingTags.includes(value)) {
                      handleInputChange('tags', [...existingTags, value]);
                    }
                    if (tagInputRef.current) {
                      tagInputRef.current.value = '';
                    }
                  }
                } else if (
                  e.key === 'Backspace' &&
                  e.currentTarget.value === ''
                ) {
                  // 如果输入框为空且按了退格键，删除最后一个标签
                  const existingTags = formData.tags || [];
                  if (existingTags.length > 0) {
                    handleInputChange('tags', existingTags.slice(0, -1));
                  }
                }
              }}
              placeholder={translate('image.edit.tagsPlaceholder')}
              className="image-edit-form-input"
            />
            <p className="image-edit-form-description">
              {translate('image.edit.tagsExample')}
            </p>
          </div>

          <div className="image-edit-button-group">
            <button
              type="button"
              onClick={handleCancel}
              className="image-edit-button image-edit-button-secondary"
            >
              {translate('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="image-edit-button image-edit-button-primary"
            >
              <Save className="image-edit-button-icon" />
              <span>
                {loading
                  ? translate('image.edit.saving')
                  : translate('image.edit.saveChanges')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImageEditModal;
