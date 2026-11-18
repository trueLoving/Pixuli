import { Save, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { AssetEditData, AssetItem } from '@pixuli/core/types';
import { AssetThumb } from '@/features/library/AssetThumb';
import {
  showLoading,
  updateLoadingToError,
  updateLoadingToSuccess,
} from '@/ui/feedback/toast';
import './AssetEditModal.css';
import { folderFromLocalPath } from './inspectorUtils';

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
  t: (key: string) => string;
}

function listFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(el => {
    if (el.closest('[aria-hidden="true"]')) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
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
  t,
}) => {
  const translate = t;
  const [formData, setFormData] = useState<AssetEditData>({
    id: asset.id,
    name: asset.name,
    description: asset.description || '',
    tags: asset.tags || [],
  });
  const panelRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  }, [onCancel, onClose]);

  const requestSave = useCallback(() => {
    if (loadingRef.current) return;
    formRef.current?.requestSubmit();
  }, []);

  /**
   * 编辑场景快捷键：
   * - Esc 取消
   * - Tab / Shift+Tab 在弹层内循环（可向上）
   * - Enter 保存（名称/文件夹等单行字段；不必先聚焦保存按钮）
   * - 描述框纯 Enter 换行；标签框有内容时 Enter 加标签
   * - ⌘/Ctrl+Enter 或 ⌘/Ctrl+S 任意处保存
   * 库级 suspend 由 AssetInspector 统一处理，避免重复计数导致回库后 ↑↓ 失效
   */
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        handleCancel();
        return;
      }

      if (event.key === 'Tab') {
        const root = panelRef.current;
        if (!root) return;
        const focusables = listFocusable(root);
        if (focusables.length === 0) return;

        // 整段自行巡焦，避免依赖浏览器默认 Tab（部分环境 Shift+Tab 无法向上）
        event.preventDefault();
        event.stopPropagation();

        const active = document.activeElement;
        let index = focusables.findIndex(el => el === active);
        if (event.shiftKey) {
          index = index <= 0 ? focusables.length - 1 : index - 1;
        } else {
          index = index < 0 || index >= focusables.length - 1 ? 0 : index + 1;
        }
        focusables[index]?.focus();
        return;
      }

      if (event.key === 'Enter') {
        const mod = event.metaKey || event.ctrlKey;
        if (mod) {
          event.preventDefault();
          event.stopPropagation();
          requestSave();
          return;
        }

        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        // 按钮交给原生激活；多行描述换行；标签框自管加标签/空框保存
        if (target instanceof HTMLButtonElement) return;
        if (target instanceof HTMLTextAreaElement) return;
        if (target.id === 'asset-edit-tags') return;

        if (
          target instanceof HTMLInputElement ||
          target instanceof HTMLSelectElement
        ) {
          event.preventDefault();
          event.stopPropagation();
          requestSave();
        }
        return;
      }

      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === 's') {
        event.preventDefault();
        event.stopPropagation();
        requestSave();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [handleCancel, isOpen, requestSave]);

  /** 打开时聚焦名称字段，便于 Tab / Shift+Tab 巡表单 */
  useEffect(() => {
    if (!isOpen) return;
    const frame = window.requestAnimationFrame(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen, asset.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
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

  const handleInputChange = (
    field: keyof AssetEditData,
    value: string | string[],
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (isOpen && asset) {
      setFormData({
        id: asset.id,
        name: asset.name,
        description: asset.description || '',
        tags: asset.tags || [],
        targetFolder: folderFromLocalPath(asset.localPath),
      });
      if (tagInputRef.current) {
        tagInputRef.current.value = '';
      }
    }
  }, [isOpen, asset]);

  if (!isOpen) return null;

  const saveShortcutHint =
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad/.test(navigator.platform)
      ? 'Enter · ⌘↵'
      : 'Enter · Ctrl+Enter';

  return (
    <div
      className="asset-edit-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="asset-edit-modal-title"
    >
      <div ref={panelRef} className="asset-edit-modal-content">
        <div className="asset-edit-modal-header">
          <h2 id="asset-edit-modal-title" className="asset-edit-modal-title">
            {translate('image.edit.title')}
          </h2>
          <button
            type="button"
            onClick={handleCancel}
            className="asset-edit-modal-close"
            aria-label={translate('common.close')}
            title={`${translate('common.close')} (Esc)`}
          >
            <X className="asset-edit-modal-close-icon" />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="image-edit-file-info">
            <span className="image-edit-file-thumb" aria-hidden>
              <AssetThumb item={asset} />
            </span>
            <div className="image-edit-file-details">
              <p className="image-edit-file-name">{asset.name}</p>
            </div>
          </div>

          <div className="image-edit-form-group">
            <label className="image-edit-form-label" htmlFor="asset-edit-name">
              {translate('image.edit.imageName')}{' '}
            </label>
            <input
              id="asset-edit-name"
              ref={nameInputRef}
              type="text"
              value={formData.name || ''}
              onChange={e => handleInputChange('name', e.target.value)}
              placeholder={translate('image.edit.namePlaceholder')}
              className="image-edit-form-input"
            />
          </div>

          <div className="image-edit-form-group">
            <label
              className="image-edit-form-label"
              htmlFor="asset-edit-description"
            >
              {translate('image.edit.imageDescription')}{' '}
              <span className="image-edit-form-optional">
                {translate('image.edit.optional')}
              </span>
            </label>
            <textarea
              id="asset-edit-description"
              value={formData.description || ''}
              onChange={e => handleInputChange('description', e.target.value)}
              placeholder={translate('image.edit.descriptionPlaceholder')}
              rows={3}
              className="image-edit-form-textarea"
            />
          </div>

          {enableFolderMove ? (
            <div className="image-edit-form-group">
              <label
                className="image-edit-form-label"
                htmlFor="asset-edit-folder"
              >
                {translate('image.edit.folder')}
              </label>
              <select
                id="asset-edit-folder"
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
            <label className="image-edit-form-label" htmlFor="asset-edit-tags">
              {translate('image.edit.tags')}{' '}
              <span className="image-edit-form-optional">
                {translate('image.edit.optional')}
              </span>
            </label>
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
            <input
              id="asset-edit-tags"
              ref={tagInputRef}
              type="text"
              onChange={e => {
                const value = e.target.value;
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
                  // ⌘/Ctrl+Enter 留给场景保存；空框 Enter 也保存；有内容则加标签
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    return;
                  }
                  e.preventDefault();
                  const value = e.currentTarget.value.trim();
                  if (e.key === 'Enter' && !value) {
                    requestSave();
                    return;
                  }
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
              title={`${translate('common.cancel')} (Esc)`}
            >
              {translate('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="image-edit-button image-edit-button-primary"
              title={`${translate('image.edit.saveChanges')} (${saveShortcutHint})`}
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
