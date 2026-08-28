import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import React from 'react';
import type { BatchUploadProgress } from '@pixuli/core/types';

export interface ImageUploadBatchProgressProps {
  batchUploadProgress: BatchUploadProgress;
  translate: (key: string) => string;
  fileNameAt?: (index: number) => string | undefined;
}

export const ImageUploadBatchProgress: React.FC<
  ImageUploadBatchProgressProps
> = ({ batchUploadProgress, translate, fileNameAt }) => (
  <div className="image-upload-progress-container">
    <div className="image-upload-progress-header">
      <h3 className="image-upload-progress-title">
        {translate('image.upload.batchProgress') || '上传进度'}
      </h3>
      <div className="image-upload-progress-count">
        {batchUploadProgress.completed + batchUploadProgress.failed} /{' '}
        {batchUploadProgress.total}
      </div>
    </div>

    <div className="image-upload-progress-overall">
      <div className="image-upload-progress-overall-header">
        <span>{translate('image.upload.overallProgress') || '总体进度'}</span>
        <span>
          {Math.round(
            ((batchUploadProgress.completed + batchUploadProgress.failed) /
              batchUploadProgress.total) *
              100,
          )}
          %
        </span>
      </div>
      <div className="image-upload-progress-bar">
        <div
          className="image-upload-progress-bar-fill"
          style={{
            width: `${((batchUploadProgress.completed + batchUploadProgress.failed) / batchUploadProgress.total) * 100}%`,
          }}
        />
      </div>
      <div className="image-upload-progress-stats">
        <span>
          {translate('image.upload.success') || '成功'}:{' '}
          {batchUploadProgress.completed}
        </span>
        <span>
          {translate('image.upload.failed') || '失败'}:{' '}
          {batchUploadProgress.failed}
        </span>
      </div>
    </div>

    {batchUploadProgress.current ? (
      <div className="image-upload-progress-current">
        <div className="image-upload-progress-current-content">
          <Loader2 className="image-upload-progress-current-spinner" />
          <span className="image-upload-progress-current-text">
            {translate('image.upload.uploadingCurrent') || '正在上传'}:{' '}
            {batchUploadProgress.current}
          </span>
        </div>
      </div>
    ) : null}

    <div className="image-upload-progress-list">
      {batchUploadProgress.items.map((item, index) => (
        <div key={item.id} className="image-upload-progress-item">
          <div className="image-upload-progress-item-icon">
            {item.status === 'success' ? (
              <CheckCircle className="image-upload-progress-item-icon success" />
            ) : null}
            {item.status === 'error' ? (
              <AlertCircle className="image-upload-progress-item-icon error" />
            ) : null}
            {item.status === 'uploading' ? (
              <Loader2 className="image-upload-progress-item-icon uploading" />
            ) : null}
          </div>
          <div className="image-upload-progress-item-info">
            <p className="image-upload-progress-item-name">
              {fileNameAt?.(index) ||
                `${translate('image.upload.file') || '文件'} ${index + 1}`}
            </p>
            <p className="image-upload-progress-item-message">
              {item.message}
              {item.status === 'success' && item.width && item.height ? (
                <span className="image-upload-progress-item-dimensions">
                  {' '}
                  ({item.width} × {item.height})
                </span>
              ) : null}
            </p>
          </div>
          <div className="image-upload-progress-item-progress">
            {item.progress}%
          </div>
        </div>
      ))}
    </div>
  </div>
);
