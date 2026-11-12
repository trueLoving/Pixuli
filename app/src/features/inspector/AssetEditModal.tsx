import { Save, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import type { AssetEditData, AssetItem } from '@pixuli/core/types';
import {
  showLoading,
  updateLoadingToError,
  updateLoadingToSuccess,
} from '@/ui/feedback/toast';
import './AssetEditModal.css';
import { folderFromLocalPath } from './inspectorUtils';
import { useResolvedAssetUrl } from './useResolvedAssetUrl';

interface AssetEditModalProps {
  asset: AssetItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdateAsset: (data: AssetEditData) => Promise<void>;
  onSuccess?: (asset: AssetItem) => void;
  onCancel?: () => void;
  loading?: boolean;
  enableFolderMove?: boolean;
  folderOptions?: string[];
  getImageDimensionsFromUrl?: (
    url: string,
  ) => Promise<{ width: number; height: number }>;
  t: (key: string) => string;
}

const AssetEditModal: React.FC<AssetEditModalProps> = ({
  asset,
  isOpen,
  onClose,
  onUpdateAsset,
  onSuccess,
  onCancel,
  loading = false,
  enableFolderMove = false,
  folderOptions = [],
  getImageDimensionsFromUrl,
  t,
}) => {
  const previewSrc = useResolvedAssetUrl(asset);
  const translate = t;
  const [formData, setFormData] = useState<AssetEditData>({
    id: asset.id,
    name: asset.name,
    description: asset.description || '',
    tags: asset.tags || [],
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
      `${translate('image.edit.updating')} "${asset.name}" ${translate('common.info')}...`,
    );
    try {
      await onUpdateAsset(formData);
      updateLoadingToSuccess(
        loadingToast,
        translate('image.edit.savedLocalOnly'),
      );
      if (onSuccess) {
        // 构建更新后的图片数据
        const updatedAsset = {
          ...asset,
          id: formData.name || asset.id,
          name: formData.name || asset.name,
          description: formData.description || asset.description,
          tags: formData.tags || asset.tags,
          updatedAt: new Date().toISOString(),
        };
        onSuccess(updatedAsset);
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
    field: keyof AssetEditData,
    value: string | string[],
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 当模态框打开或图片更新时，更新表单数据
  useEffect(() => {
    if (isOpen && asset) {
      setFormData({
        id: asset.id,
        name: asset.name,
        description: asset.description || '',
        tags: asset.tags || [],
        targetFolder: folderFromLocalPath(asset.localPath),
      });
      // 清空标签输入框
      if (tagInputRef.current) {
        tagInputRef.current.value = '';
      }
    }
  }, [isOpen, asset]);

  // 获取图片真实尺寸
  useEffect(() => {
    if (
      isOpen &&
      asset &&
      previewSrc &&
      getImageDimensionsFromUrl &&
      (asset.width === 0 || asset.height === 0)
    ) {
      getImageDimensionsFromUrl(previewSrc)
        .then(dimensions => {
          setImageDimensions(dimensions);
        })
        .catch(error => {
          console.warn(`Failed to get dimensions for ${asset.name}:`, error);
        });
    }
  }, [isOpen, asset, previewSrc, getImageDimensionsFromUrl]);

  if (!isOpen) return null;

  return (
    <div className="asset-edit-modal-overlay">
      <div className="asset-edit-modal-content">
        <div className="asset-edit-modal-header">
          <h2 className="asset-edit-modal-title">
            {translate('image.edit.title')}
          </h2>
          <button onClick={onClose} className="asset-edit-modal-close">
            <X className="asset-edit-modal-close-icon" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 图片预览 */}
          <div className="image-edit-file-info">
            {previewSrc ? (
              <img
                src={previewSrc}
                alt={asset.name}
                className="image-edit-file-thumbnail"
              />
            ) : null}
            <div className="image-edit-file-details">
              <p className="image-edit-file-name">{asset.name}</p>
              <p className="image-edit-file-size">
                {translate('image.edit.dimensions')}:{' '}
                {(() => {
                  if (imageDimensions) {
                    return `${imageDimensions.width} × ${imageDimensions.height}`;
                  } else if (asset.width > 0 && asset.height > 0) {
                    return `${asset.width} × ${asset.height}`;
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

          {enableFolderMove ? (
            <div className="image-edit-form-group">
              <label className="image-edit-form-label">
                {translate('image.edit.folder')}
              </label>
              <select
                className="image-edit-form-input"
                value={formData.targetFolder ?? ''}
                onChange={e =>
                  handleInputChange('targetFolder', e.target.value)
                }
              >
                <option value="">{translate('workspace.allImages')}</option>
                {folderOptions.map(folder => (
                  <option key={folder} value={folder}>
                    {folder}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

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

export default AssetEditModal;
