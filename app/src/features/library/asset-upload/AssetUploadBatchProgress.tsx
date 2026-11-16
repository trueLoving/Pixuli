import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import React from 'react';
import type { BatchUploadProgress } from '@pixuli/core/types';
import './AssetUploadBatchProgress.css';

export interface AssetUploadBatchProgressProps {
  batchUploadProgress: BatchUploadProgress;
  translate: (key: string) => string;
  fileNameAt?: (index: number) => string | undefined;
}

export const AssetUploadBatchProgress: React.FC<
  AssetUploadBatchProgressProps
> = ({ batchUploadProgress, translate, fileNameAt }) => (
  <div className="asset-upload-progress-container">
    <div className="asset-upload-progress-header">
      <h3 className="asset-upload-progress-title">
        {translate('image.upload.batchProgress') || '上传进度'}
      </h3>
      <div className="asset-upload-progress-count">
        {batchUploadProgress.completed + batchUploadProgress.failed} /{' '}
        {batchUploadProgress.total}
      </div>
    </div>

    <div className="asset-upload-progress-overall">
      <div className="asset-upload-progress-overall-header">
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
      <div className="asset-upload-progress-bar">
        <div
          className="asset-upload-progress-bar-fill"
          style={{
            width: `${((batchUploadProgress.completed + batchUploadProgress.failed) / batchUploadProgress.total) * 100}%`,
          }}
        />
      </div>
      <div className="asset-upload-progress-stats">
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
      <div className="asset-upload-progress-current">
        <div className="asset-upload-progress-current-content">
          <Loader2 className="asset-upload-progress-current-spinner" />
          <span className="asset-upload-progress-current-text">
            {translate('image.upload.uploadingCurrent') || '正在上传'}:{' '}
            {batchUploadProgress.current}
          </span>
        </div>
      </div>
    ) : null}

    <div className="asset-upload-progress-list">
      {batchUploadProgress.items.map((item, index) => (
        <div key={item.id} className="asset-upload-progress-item">
          <div className="asset-upload-progress-item-icon">
            {item.status === 'success' ? (
              <CheckCircle className="asset-upload-progress-item-icon success" />
            ) : null}
            {item.status === 'error' ? (
              <AlertCircle className="asset-upload-progress-item-icon error" />
            ) : null}
            {item.status === 'uploading' ? (
              <Loader2 className="asset-upload-progress-item-icon uploading" />
            ) : null}
          </div>
          <div className="asset-upload-progress-item-info">
            <p className="asset-upload-progress-item-name">
              {fileNameAt?.(index) ||
                `${translate('image.upload.file') || '文件'} ${index + 1}`}
            </p>
            <p className="asset-upload-progress-item-message">
              {item.message}
              {item.status === 'success' && item.width && item.height ? (
                <span className="asset-upload-progress-item-dimensions">
                  {' '}
                  ({item.width} × {item.height})
                </span>
              ) : null}
            </p>
          </div>
          <div className="asset-upload-progress-item-progress">
            {item.progress}%
          </div>
        </div>
      ))}
    </div>
  </div>
);
