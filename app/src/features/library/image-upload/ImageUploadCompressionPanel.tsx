import { Loader2 } from 'lucide-react';
import React from 'react';
import type { ImageCompressionOptions } from '@pixuli/core/types';
import type { CompressionPreviewMap } from './imageUploadTypes';
import { formatByteSize } from './imageUploadUtils';

export interface ImageUploadCompressionPanelProps {
  files: File[];
  enableCrop: boolean;
  enableCompression: boolean;
  userWantsCrop: boolean;
  userWantsCompress: boolean;
  calculatingCompression: boolean;
  showCompressionConfig: boolean;
  userCompressionConfig: ImageCompressionOptions;
  compressionPreview: CompressionPreviewMap;
  onCropToggle: (checked: boolean) => void;
  onCompressionToggle: (checked: boolean) => void;
  onToggleCompressionConfig: () => void;
  onCompressionConfigChange: (config: ImageCompressionOptions) => void;
}

export const ImageUploadCompressionPanel: React.FC<
  ImageUploadCompressionPanelProps
> = ({
  files,
  enableCrop,
  enableCompression,
  userWantsCrop,
  userWantsCompress,
  calculatingCompression,
  showCompressionConfig,
  userCompressionConfig,
  compressionPreview,
  onCropToggle,
  onCompressionToggle,
  onToggleCompressionConfig,
  onCompressionConfigChange,
}) => {
  if (!(enableCompression || enableCrop)) {
    return null;
  }
  if (!files.every(file => file.type.startsWith('image/'))) {
    return null;
  }

  return (
    <div className="image-upload-form-group">
      <label className="image-upload-form-label">处理选项</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {enableCrop ? (
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            <input
              type="checkbox"
              checked={userWantsCrop}
              onChange={e => onCropToggle(e.target.checked)}
              style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
            />
            <span>裁剪图片</span>
          </label>
        ) : null}
        {enableCompression ? (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  flex: 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={userWantsCompress}
                  onChange={e => onCompressionToggle(e.target.checked)}
                  style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
                />
                <span>压缩图片</span>
                {calculatingCompression ? (
                  <Loader2
                    style={{
                      width: '0.875rem',
                      height: '0.875rem',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                ) : null}
              </label>
              <button
                type="button"
                onClick={onToggleCompressionConfig}
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  color: '#0369a1',
                  backgroundColor: 'transparent',
                  border: '1px solid #bae6fd',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                }}
              >
                {showCompressionConfig ? '收起配置' : '配置'}
              </button>
            </div>
            {showCompressionConfig ? (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.25rem',
                        fontWeight: 500,
                        color: '#374151',
                      }}
                    >
                      压缩质量:{' '}
                      {Math.round((userCompressionConfig.quality || 0.8) * 100)}
                      %
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={userCompressionConfig.quality || 0.8}
                      onChange={e => {
                        onCompressionConfigChange({
                          ...userCompressionConfig,
                          quality: parseFloat(e.target.value),
                        });
                      }}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '0.25rem',
                          fontWeight: 500,
                          color: '#374151',
                        }}
                      >
                        最大宽度 (px)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={userCompressionConfig.maxWidth || ''}
                        onChange={e => {
                          onCompressionConfigChange({
                            ...userCompressionConfig,
                            maxWidth: e.target.value
                              ? parseInt(e.target.value, 10)
                              : undefined,
                          });
                        }}
                        placeholder="不限制"
                        style={{
                          width: '100%',
                          padding: '0.375rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '0.25rem',
                          fontWeight: 500,
                          color: '#374151',
                        }}
                      >
                        最大高度 (px)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={userCompressionConfig.maxHeight || ''}
                        onChange={e => {
                          onCompressionConfigChange({
                            ...userCompressionConfig,
                            maxHeight: e.target.value
                              ? parseInt(e.target.value, 10)
                              : undefined,
                          });
                        }}
                        placeholder="不限制"
                        style={{
                          width: '100%',
                          padding: '0.375rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.25rem',
                        fontWeight: 500,
                        color: '#374151',
                      }}
                    >
                      输出格式
                    </label>
                    <select
                      value={userCompressionConfig.outputFormat || 'image/jpeg'}
                      onChange={e => {
                        onCompressionConfigChange({
                          ...userCompressionConfig,
                          outputFormat: e.target.value as
                            | 'image/jpeg'
                            | 'image/png'
                            | 'image/webp',
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '0.375rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                      }}
                    >
                      <option value="image/jpeg">JPEG</option>
                      <option value="image/png">PNG</option>
                      <option value="image/webp">WebP</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : null}
            {userWantsCompress &&
            !calculatingCompression &&
            Object.keys(compressionPreview).length > 0 ? (
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                }}
              >
                <div
                  style={{
                    fontWeight: 500,
                    marginBottom: '0.5rem',
                    color: '#0369a1',
                  }}
                >
                  压缩预览
                </div>
                {files.map((file, index) => {
                  const preview = compressionPreview[file.name];
                  if (!preview) return null;

                  const sizeChanged =
                    preview.originalSize !== preview.compressedSize;
                  const dimensionsChanged =
                    preview.originalDimensions.width !==
                      preview.compressedDimensions.width ||
                    preview.originalDimensions.height !==
                      preview.compressedDimensions.height;

                  return (
                    <div
                      key={index}
                      style={{
                        marginBottom: index < files.length - 1 ? '0.5rem' : 0,
                        paddingBottom: index < files.length - 1 ? '0.5rem' : 0,
                        borderBottom:
                          index < files.length - 1
                            ? '1px solid #bae6fd'
                            : 'none',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 500,
                          marginBottom: '0.25rem',
                          color: '#0c4a6e',
                        }}
                      >
                        {file.name}
                      </div>
                      <div style={{ color: '#075985' }}>
                        <div>
                          文件大小:{' '}
                          <span
                            style={{
                              textDecoration: sizeChanged
                                ? 'line-through'
                                : 'none',
                              color: sizeChanged ? '#64748b' : 'inherit',
                            }}
                          >
                            {formatByteSize(preview.originalSize)}
                          </span>
                          {sizeChanged ? (
                            <>
                              {' → '}
                              <span
                                style={{ color: '#059669', fontWeight: 500 }}
                              >
                                {formatByteSize(preview.compressedSize)}
                              </span>{' '}
                              <span
                                style={{
                                  color:
                                    preview.compressionRatio > 30
                                      ? '#059669'
                                      : preview.compressionRatio > 10
                                        ? '#d97706'
                                        : '#64748b',
                                  fontWeight: 500,
                                }}
                              >
                                (节省 {preview.compressionRatio.toFixed(1)}%)
                              </span>
                            </>
                          ) : null}
                        </div>
                        {dimensionsChanged ? (
                          <div style={{ marginTop: '0.25rem' }}>
                            尺寸:{' '}
                            <span
                              style={{
                                textDecoration: 'line-through',
                                color: '#64748b',
                              }}
                            >
                              {preview.originalDimensions.width} ×{' '}
                              {preview.originalDimensions.height}
                            </span>
                            {' → '}
                            <span style={{ color: '#059669', fontWeight: 500 }}>
                              {preview.compressedDimensions.width} ×{' '}
                              {preview.compressedDimensions.height}
                            </span>
                          </div>
                        ) : null}
                        {!sizeChanged && !dimensionsChanged ? (
                          <div
                            style={{ color: '#64748b', fontStyle: 'italic' }}
                          >
                            文件较小，无需压缩
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
};
