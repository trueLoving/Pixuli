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
  formatByteSize,
  isPreviewableMedia,
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
  destinationFolder: string;
  translate: (key: string) => string;
  tagInputRef: RefObject<HTMLInputElement | null>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onRemoveFile: (index: number) => void;
  onAppendFiles: (files: File[]) => void;
  onFieldChange: (
    field: keyof UploadFormData,
    value: string | string[],
  ) => void;
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
  destinationFolder,
  translate,
  tagInputRef,
  onSubmit,
  onCancel,
  onRemoveFile,
  onAppendFiles,
  onFieldChange,
  ...compressionProps
}) => {
  const addMoreRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="image-upload-form-container">
      <form onSubmit={onSubmit} className="image-upload-form">
        <div className="image-upload-form-main">
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

          <div className="image-upload-file-toolbar">
            <p>
              {translate('image.upload.selectedCount').replace(
                '{count}',
                String(files.length),
              )}
            </p>
            <button
              type="button"
              className="image-upload-add-more"
              onClick={() => addMoreRef.current?.click()}
            >
              {translate('image.upload.addMore')}
            </button>
            <input
              ref={addMoreRef}
              type="file"
              multiple
              hidden
              accept="image/*,video/*,application/pdf,.txt,.md,.json,.zip"
              onChange={event => {
                const picked = event.target.files
                  ? Array.from(event.target.files)
                  : [];
                event.target.value = '';
                if (picked.length > 0) onAppendFiles(picked);
              }}
            />
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
                <div
                  key={`${file.name}-${file.size}-${index}`}
                  className="image-upload-file-item"
                >
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
                    <p className="image-upload-file-meta">
                      <span>{fileTypeLabel(file, translate)}</span>
                      <span>{formatByteSize(file.size)}</span>
                      {dimensionsText ? <span>{dimensionsText}</span> : null}
                      {!previewable ? (
                        <span>
                          {translate('image.upload.previewUnavailable')}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="image-upload-file-remove"
                    aria-label={translate('image.upload.removeFile').replace(
                      '{name}',
                      file.name,
                    )}
                    onClick={() => onRemoveFile(index)}
                  >
                    <X className="image-upload-tag-remove-icon" />
                  </button>
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

          <p className="image-upload-destination">
            {translate('image.upload.folder')}
            <span>{destinationFolder}</span>
          </p>

          <details className="image-upload-extra">
            <summary>{translate('image.upload.extraFields')}</summary>
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
                rows={2}
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
              {Array.isArray(currentData?.tags) &&
              currentData.tags.length > 0 ? (
                <div className="image-upload-tags-container">
                  {currentData.tags.map((tag, index) => (
                    <span key={index} className="image-upload-tag">
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          const newTags =
                            currentData.tags?.filter((_, i) => i !== index) ||
                            [];
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
                      onFieldChange('tags', [
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
          </details>
        </div>

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
