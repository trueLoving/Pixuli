import { compressImage } from '@packages/common/src/utils/imageUtils';
import { Download, FileImage, Loader2, Zap } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useI18n } from '../../i18n/useI18n';
import './index.css';

export const CompressPage: React.FC = () => {
  const { t } = useI18n();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressionResult, setCompressionResult] = useState<{
    compressedFile: File;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  } | null>(null);

  // 处理文件选择
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type.startsWith('image/')) {
        setSelectedFile(file);
        setCompressionResult(null);
      }
    },
    [],
  );

  // 处理拖拽
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    if (imageFile) {
      setSelectedFile(imageFile);
      setCompressionResult(null);
    }
  }, []);

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    [],
  );

  // 处理图片压缩
  const handleCompress = useCallback(async () => {
    if (!selectedFile) return;

    setCompressing(true);
    try {
      const result = await compressImage(selectedFile, {
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080,
        maintainAspectRatio: true,
        outputFormat: 'image/jpeg',
      });
      setCompressionResult({
        compressedFile: result.compressedFile,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        compressionRatio: result.compressionRatio,
      });
    } catch (error) {
      console.error('压缩失败:', error);
      alert(t('utilityTools.compressError') || '压缩失败');
    } finally {
      setCompressing(false);
    }
  }, [selectedFile, t]);

  // 下载压缩后的文件
  const handleDownload = useCallback(() => {
    if (!compressionResult) return;

    const url = URL.createObjectURL(compressionResult.compressedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = compressionResult.compressedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [compressionResult]);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="compress-page">
      <div className="compress-page-container">
        {/* 左侧：文件选择和设置 */}
        <div className="compress-page-left">
          {!selectedFile ? (
            <div
              className="compress-page-dropzone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="compress-page-file-input"
                id="compress-page-file-input"
              />
              <label
                htmlFor="compress-page-file-input"
                className="compress-page-dropzone-label"
              >
                <FileImage size={64} className="compress-page-dropzone-icon" />
                <p className="compress-page-dropzone-text">
                  {t('utilityTools.selectFile') || '选择图片文件'}
                </p>
                <p className="compress-page-dropzone-hint">
                  {t('utilityTools.dragDrop') || '或拖拽图片到这里'}
                </p>
              </label>
            </div>
          ) : (
            <div className="compress-page-file-info">
              <p className="compress-page-file-name">{selectedFile.name}</p>
              <p className="compress-page-file-size">
                {formatFileSize(selectedFile.size)}
              </p>
              {!compressionResult && (
                <button
                  className="compress-page-compress-btn"
                  onClick={handleCompress}
                  disabled={compressing}
                >
                  {compressing ? (
                    <>
                      <Loader2 size={20} className="spinning" />
                      <span>压缩中...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={20} />
                      <span>{t('utilityTools.compress') || '压缩'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* 右侧：预览和结果 */}
        <div className="compress-page-right">
          {selectedFile ? (
            <div className="compress-page-preview">
              {compressionResult ? (
                <div className="compress-page-result">
                  <div className="compress-page-result-item">
                    <span className="compress-page-result-label">
                      {t('utilityTools.originalSize') || '原始大小'}:
                    </span>
                    <span className="compress-page-result-value">
                      {formatFileSize(compressionResult.originalSize)}
                    </span>
                  </div>
                  <div className="compress-page-result-item">
                    <span className="compress-page-result-label">
                      {t('utilityTools.compressedSize') || '压缩后大小'}:
                    </span>
                    <span className="compress-page-result-value">
                      {formatFileSize(compressionResult.compressedSize)}
                    </span>
                  </div>
                  <div className="compress-page-result-item">
                    <span className="compress-page-result-label">
                      {t('utilityTools.compressionRatio') || '压缩率'}:
                    </span>
                    <span className="compress-page-result-value">
                      {compressionResult.compressionRatio.toFixed(1)}%
                    </span>
                  </div>
                  <button
                    className="compress-page-download-btn"
                    onClick={handleDownload}
                  >
                    <Download size={20} />
                    <span>{t('utilityTools.download') || '下载'}</span>
                  </button>
                </div>
              ) : (
                <div className="compress-page-preview-placeholder">
                  <FileImage size={48} />
                  <p>{t('utilityTools.compress') || '图片压缩'}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="compress-page-preview-placeholder">
              <FileImage size={48} />
              <p>{t('utilityTools.selectFile') || '请选择图片文件'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompressPage;
