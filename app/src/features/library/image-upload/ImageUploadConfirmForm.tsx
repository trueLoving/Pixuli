import { Image as ImageIcon, Upload, X } from 'lucide-react';
import React, { RefObject } from 'react';
import type {
  MultiImageUploadData,
  WebImageUploadData,
} from '@pixuli/core/types';
import { ImageUploadCompressionPanel } from './ImageUploadCompressionPanel';
import type { ImageUploadCompressionPanelProps } from './ImageUploadCompressionPanel';
import {
  fileTypeLabel,
  isPreviewableMedia,
  needsRichConfirm,
} from './imageUploadUtils';
import './ImageUploadConfirmForm.css';

type UploadFormData = WebImageUploadData | MultiImageUploadData;

export interface ImageUploadConfirmFormProps
  extends Omit<
    ImageUploadCompressionPanelProps,
    'files' | 'enableCrop' | 'enableCompression'
  > {
  files: File[];
  isMultipleUpload: boolean;
  currentData: UploadFormData;
  fileDimensions: Record<string, { width: number; height: number }>;
  previewUrls: Map<string, string>;
  enableCrop?: boolean;
  enableCompression?: boolean;
  loading: boolean;
  translate: (key: string) => string;
  tagInputRef: RefObject<HTMLInputElement | null>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onFieldChange: (
    field: keyof UploadFormData,
    value: string | string[],
  ) => void;
  editAfterAdd?: boolean;
  onEditAfterAddChange?: (value: boolean) => void;
  showEditAfterAddOption?: boolean;
}

export const ImageUploadConfirmForm: React.FC<ImageUploadConfirmFormProps> = ({
  files,
  isMultipleUpload,
  currentData,
  fileDimensions,
  previewUrls,
  enableCrop = false,
  enableCompression = false,
  loading,
  translate,
  tagInputRef,
  onSubmit,
  onCancel,
  onFieldChange,
  editAfterAdd = false,
  onEditAfterAddChange,
  showEditAfterAddOption = false,
  ...compressionProps
}) => {
  const richConfirm = files.length > 0 && needsRichConfirm(files);

  return (
    <div className="image-upload-form-container">
      <form onSubmit={onSubmit} className="image-upload-form">
        <div className="image-upload-confirm-header">
          <p className="image-upload-confirm-title">
            {translate('image.upload.confirmTitle')}
          </p>
          <p className="image-upload-confirm-hint">
            <span className="image-upload-local-badge">
              {translate('image.upload.localOnlyBadge')}
            </span>
            {translate('image.upload.confirmHint')}
          </p>
        </div>

        <div className="image-upload-file-list">
          {files.map((file, index) => {
            const dimensions = fileDimensions[file.name];
            const dimensionsText =
              dimensions && dimensions.width > 0 && dimensions.height > 0
                ? `${dimensions.width} × ${dimensions.height}`
                : null;
            const previewable = isPreviewableMedia(file);
            const previewUrl = previewUrls.get(file.name + file.size) ?? null;
            return (
              <div key={index} className="image-upload-file-item">
                <span className="image-upload-type-badge">
                  {fileTypeLabel(file, translate)}
                </span>
                {previewUrl && file.type.startsWith('image/') ? (
                  <img
                    src={previewUrl}
                    alt=""
                    className="image-upload-file-thumb"
                  />
                ) : previewUrl && file.type.startsWith('video/') ? (
                  <video
                    src={previewUrl}
                    className="image-upload-file-thumb"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <ImageIcon className="image-upload-file-icon" />
                )}
                <div className="image-upload-file-info">
                  <p className="image-upload-file-name">{file.name}</p>
                  <div className="image-upload-file-meta">
                    <p className="image-upload-file-size">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {dimensionsText ? (
                      <p className="image-upload-file-dimensions">
                        {dimensionsText}
                      </p>
                    ) : null}
                    {!previewable ? (
                      <p className="image-upload-file-dimensions">
                        {translate('image.upload.previewUnavailable')}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <ImageUploadCompressionPanel
          files={files}
          enableCrop={enableCrop}
          enableCompression={enableCompression}
          {...compressionProps}
        />

        <div className="image-upload-form-group">
          <label className="image-upload-form-label">
            {translate('image.upload.description')}{' '}
            <span className="image-upload-form-optional">
              {translate('image.upload.optional')}
            </span>
          </label>
          <textarea
            value={currentData?.description || ''}
            onChange={e => onFieldChange('description', e.target.value)}
            placeholder={
              isMultipleUpload
                ? translate('image.upload.descriptionPlaceholderMultiple')
                : translate('image.upload.descriptionPlaceholder')
            }
            rows={richConfirm ? 3 : 2}
            className="image-upload-form-textarea"
          />
        </div>

        <div className="image-upload-form-group">
          <label className="image-upload-form-label">
            {translate('image.upload.tags')}{' '}
            <span className="image-upload-form-optional">
              {translate('image.upload.optional')}
            </span>
          </label>
          {Array.isArray(currentData?.tags) && currentData.tags.length > 0 ? (
            <div className="image-upload-tags-container">
              {currentData.tags.map((tag, index) => (
                <span key={index} className="image-upload-tag">
                  {tag}
                  <button
                    type="button"
                    onClick={() => {
                      const newTags =
                        currentData.tags?.filter((_, i) => i !== index) || [];
                      onFieldChange('tags', newTags);
                    }}
                    className="image-upload-tag-remove"
                  >
                    <X className="image-upload-tag-remove-icon" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          <input
            ref={tagInputRef}
            type="text"
            onChange={e => {
              const value = e.target.value;
              if (value.includes(',')) {
                const newTags = value
                  .split(',')
                  .map(tag => tag.trim())
                  .filter(Boolean);
                const existingTags = currentData?.tags || [];
                const uniqueNewTags = newTags.filter(
                  tag => !existingTags.includes(tag),
                );
                if (uniqueNewTags.length > 0) {
                  onFieldChange('tags', [...existingTags, ...uniqueNewTags]);
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
                  const existingTags = currentData?.tags || [];
                  if (!existingTags.includes(value)) {
                    onFieldChange('tags', [...existingTags, value]);
                  }
                  if (tagInputRef.current) {
                    tagInputRef.current.value = '';
                  }
                }
              } else if (
                e.key === 'Backspace' &&
                e.currentTarget.value === ''
              ) {
                const existingTags = currentData?.tags || [];
                if (existingTags.length > 0) {
                  onFieldChange('tags', existingTags.slice(0, -1));
                }
              }
            }}
            placeholder={
              isMultipleUpload
                ? translate('image.upload.tagsPlaceholderMultiple')
                : translate('image.upload.tagsPlaceholder')
            }
            className="image-upload-form-input"
          />
        </div>

        {showEditAfterAddOption ? (
          <label className="image-upload-edit-after">
            <input
              type="checkbox"
              checked={editAfterAdd}
              onChange={event => onEditAfterAddChange?.(event.target.checked)}
            />
            <span>{translate('image.upload.editAfterAdd')}</span>
          </label>
        ) : null}

        <div className="image-upload-button-group">
          <button
            type="button"
            onClick={onCancel}
            className="image-upload-button image-upload-button-secondary"
          >
            {translate('image.upload.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="image-upload-button image-upload-button-primary"
          >
            {loading ? (
              <>
                <div className="image-upload-spinner" />
                <span>{translate('image.upload.uploading')}</span>
              </>
            ) : (
              <>
                <Upload className="image-upload-button-icon" />
                <span>
                  {isMultipleUpload
                    ? `${translate('image.upload.batchUploadButton')} (${files.length})`
                    : translate('image.upload.uploadButton')}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
