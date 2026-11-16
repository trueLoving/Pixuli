import { Image as ImageIcon, Upload, X } from 'lucide-react';
import React, { RefObject } from 'react';
import type {
  MultiAssetUploadData,
  WebAssetUploadData,
} from '@pixuli/core/types';
import { AssetUploadCompressionPanel } from './AssetUploadCompressionPanel';
import type { AssetUploadCompressionPanelProps } from './AssetUploadCompressionPanel';
import {
  fileTypeLabel,
  formatByteSize,
  isPreviewableMedia,
} from './assetUploadUtils';
import './AssetUploadConfirmForm.css';

type UploadFormData = WebAssetUploadData | MultiAssetUploadData;

export interface AssetUploadConfirmFormProps
  extends Omit<
    AssetUploadCompressionPanelProps,
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

export const AssetUploadConfirmForm: React.FC<AssetUploadConfirmFormProps> = ({
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
    <div className="asset-upload-form-container">
      <form onSubmit={onSubmit} className="asset-upload-form">
        <div className="asset-upload-form-main">
          <div className="asset-upload-confirm-header">
            <p className="asset-upload-confirm-title">
              {translate('image.upload.confirmTitle')}
            </p>
            <p className="asset-upload-confirm-hint">
              <span className="asset-upload-local-badge">
                {translate('image.upload.localOnlyBadge')}
              </span>
              {translate('image.upload.confirmHint')}
            </p>
          </div>

          <div className="asset-upload-file-toolbar">
            <p>
              {translate('image.upload.selectedCount').replace(
                '{count}',
                String(files.length),
              )}
            </p>
            <button
              type="button"
              className="asset-upload-add-more"
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

          <div className="asset-upload-file-list">
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
                  className="asset-upload-file-item"
                >
                  {previewUrl && file.type.startsWith('image/') ? (
                    <img
                      src={previewUrl}
                      alt=""
                      className="asset-upload-file-thumb"
                    />
                  ) : previewUrl && file.type.startsWith('video/') ? (
                    <video
                      src={previewUrl}
                      className="asset-upload-file-thumb"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <ImageIcon className="asset-upload-file-icon" />
                  )}
                  <div className="asset-upload-file-info">
                    <p className="asset-upload-file-name">{file.name}</p>
                    <p className="asset-upload-file-meta">
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
                    className="asset-upload-file-remove"
                    aria-label={translate('image.upload.removeFile').replace(
                      '{name}',
                      file.name,
                    )}
                    onClick={() => onRemoveFile(index)}
                  >
                    <X className="asset-upload-tag-remove-icon" />
                  </button>
                </div>
              );
            })}
          </div>

          <AssetUploadCompressionPanel
            files={files}
            enableCrop={enableCrop}
            enableCompression={enableCompression}
            {...compressionProps}
          />

          <p className="asset-upload-destination">
            {translate('image.upload.folder')}
            <span>
              {destinationFolder || translate('image.library.rootFolder')}
            </span>
          </p>

          <details className="asset-upload-extra">
            <summary>{translate('image.upload.extraFields')}</summary>
            <div className="asset-upload-form-group">
              <label className="asset-upload-form-label">
                {translate('image.upload.description')}{' '}
                <span className="asset-upload-form-optional">
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
                className="asset-upload-form-textarea"
              />
            </div>

            <div className="asset-upload-form-group">
              <label className="asset-upload-form-label">
                {translate('image.upload.tags')}{' '}
                <span className="asset-upload-form-optional">
                  {translate('image.upload.optional')}
                </span>
              </label>
              {Array.isArray(currentData?.tags) &&
              currentData.tags.length > 0 ? (
                <div className="asset-upload-tags-container">
                  {currentData.tags.map((tag, index) => (
                    <span key={index} className="asset-upload-tag">
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          const newTags =
                            currentData.tags?.filter((_, i) => i !== index) ||
                            [];
                          onFieldChange('tags', newTags);
                        }}
                        className="asset-upload-tag-remove"
                      >
                        <X className="asset-upload-tag-remove-icon" />
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
                className="asset-upload-form-input"
              />
            </div>
          </details>
        </div>

        <div className="asset-upload-button-group">
          <button
            type="button"
            onClick={onCancel}
            className="asset-upload-button asset-upload-button-secondary"
          >
            {translate('image.upload.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="asset-upload-button asset-upload-button-primary"
          >
            {loading ? (
              <>
                <div className="asset-upload-spinner" />
                <span>{translate('image.upload.uploading')}</span>
              </>
            ) : (
              <>
                <Upload className="asset-upload-button-icon" />
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
