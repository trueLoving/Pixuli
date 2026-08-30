import { Save, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import type { BatchMetadataPatch } from '@/features/library/assetMutationService';
import {
  showLoading,
  updateLoadingToError,
  updateLoadingToSuccess,
} from '@/ui/feedback/toast';
import './AssetLibraryBatchEditModal.css';

export interface AssetLibraryBatchEditModalProps {
  isOpen: boolean;
  selectedCount: number;
  loading?: boolean;
  t: (key: string) => string;
  onClose: () => void;
  onSubmit: (
    patch: BatchMetadataPatch,
  ) => Promise<{ updated: number; failed: number }>;
}

export const AssetLibraryBatchEditModal: React.FC<
  AssetLibraryBatchEditModalProps
> = ({ isOpen, selectedCount, loading = false, t, onClose, onSubmit }) => {
  const [tagsInput, setTagsInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [updateDescription, setUpdateDescription] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTagsInput('');
    setTags([]);
    setDescription('');
    setUpdateDescription(false);
  }, [isOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const appendTags = (raw: string) => {
    const next = raw
      .split(/[,，]/)
      .map(tag => tag.trim())
      .filter(Boolean);
    if (next.length === 0) return;
    setTags(prev => {
      const seen = new Set(prev);
      const merged = [...prev];
      for (const tag of next) {
        if (seen.has(tag)) continue;
        seen.add(tag);
        merged.push(tag);
      }
      return merged;
    });
    setTagsInput('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const tagsToAppend = [...tags];
    if (tagsInput.trim()) {
      const pending = tagsInput
        .split(/[,，]/)
        .map(tag => tag.trim())
        .filter(Boolean);
      const seen = new Set(tagsToAppend);
      for (const tag of pending) {
        if (seen.has(tag)) continue;
        seen.add(tag);
        tagsToAppend.push(tag);
      }
    }

    if (tagsToAppend.length === 0 && !updateDescription) {
      onClose();
      return;
    }

    const loadingToast = showLoading(t('image.library.batchEditSaving'));
    try {
      const result = await onSubmit({
        tagsToAppend,
        updateDescription,
        description,
      });
      if (result.failed > 0) {
        updateLoadingToError(
          loadingToast,
          t('image.library.batchEditPartial').replace(
            '{failed}',
            String(result.failed),
          ),
        );
      } else {
        updateLoadingToSuccess(
          loadingToast,
          t('image.library.batchEditSuccess').replace(
            '{count}',
            String(result.updated),
          ),
        );
      }
      onClose();
    } catch (error) {
      updateLoadingToError(
        loadingToast,
        `${t('image.library.batchEditFailed')}: ${
          error instanceof Error ? error.message : t('common.error')
        }`,
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="asset-library-batch-edit-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="asset-library-batch-edit-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-library-batch-edit-title"
        onClick={event => event.stopPropagation()}
      >
        <div className="asset-library-batch-edit-header">
          <h2
            id="asset-library-batch-edit-title"
            className="asset-library-batch-edit-title"
          >
            {t('image.library.batchEditTitle')}
          </h2>
          <button
            type="button"
            className="asset-library-batch-edit-close"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <p className="asset-library-batch-edit-scope">
          {t('image.library.batchEditScope').replace(
            '{count}',
            String(selectedCount),
          )}
        </p>

        <form className="asset-library-batch-edit-form" onSubmit={handleSubmit}>
          <div className="asset-library-batch-edit-field">
            <label htmlFor="batch-edit-tags">{t('image.edit.tags')}</label>
            <p className="asset-library-batch-edit-hint">
              {t('image.library.batchEditTagsHint')}
            </p>
            {tags.length > 0 ? (
              <div className="asset-library-batch-edit-tags">
                {tags.map((tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    className="asset-library-batch-edit-tag"
                  >
                    {tag}
                    <button
                      type="button"
                      aria-label={t('common.delete')}
                      onClick={() =>
                        setTags(prev => prev.filter((_, i) => i !== index))
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
            <input
              ref={tagInputRef}
              id="batch-edit-tags"
              type="text"
              value={tagsInput}
              onChange={event => setTagsInput(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ',') {
                  event.preventDefault();
                  appendTags(tagsInput);
                } else if (
                  event.key === 'Backspace' &&
                  tagsInput === '' &&
                  tags.length > 0
                ) {
                  setTags(prev => prev.slice(0, -1));
                }
              }}
              onBlur={() => {
                if (tagsInput.trim()) appendTags(tagsInput);
              }}
              placeholder={t('image.edit.tagsPlaceholder')}
              disabled={loading}
            />
          </div>

          <div className="asset-library-batch-edit-field">
            <label className="asset-library-batch-edit-check">
              <input
                type="checkbox"
                checked={updateDescription}
                onChange={event => setUpdateDescription(event.target.checked)}
                disabled={loading}
              />
              <span>{t('image.library.batchEditUpdateDescription')}</span>
            </label>
            <p className="asset-library-batch-edit-hint">
              {t('image.library.batchEditDescriptionHint')}
            </p>
            <textarea
              id="batch-edit-description"
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder={t('image.edit.descriptionPlaceholder')}
              rows={3}
              disabled={loading || !updateDescription}
            />
          </div>

          <div className="asset-library-batch-edit-actions">
            <button
              type="button"
              className="asset-library-chrome-btn"
              onClick={onClose}
              disabled={loading}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="asset-library-chrome-btn asset-library-batch-edit-save"
              disabled={loading}
            >
              <Save size={16} aria-hidden />
              {t('image.library.batchEditSave')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
