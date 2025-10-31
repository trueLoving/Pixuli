import { defaultTranslate } from '@packages/ui/src';
import {
  Clock,
  Download,
  Eye,
  Minus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import zhCN from './locales/zh-CN.json';
import { FormatConversionResult } from './types';

interface ImageFormatConversionPreviewProps {
  originalFile: File | null;
  conversionResult: FormatConversionResult | null;
  isConverting: boolean;
  onDownload: (file: File) => void;
  onRetry: () => void;
  t?: (key: string) => string;
}

const dT = (key: string) => {
  return defaultTranslate(key, zhCN);
};

const ImageFormatConversionPreview: React.FC<
  ImageFormatConversionPreviewProps
> = ({
  originalFile,
  conversionResult,
  isConverting,
  onDownload,
  onRetry,
  t = dT,
}) => {
  const [originalPreview, setOriginalPreview] = useState<string>('');
  const [convertedPreview, setConvertedPreview] = useState<string>('');

  // 创建原始图片预览
  useEffect(() => {
    if (originalFile) {
      const url = URL.createObjectURL(originalFile);
      setOriginalPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [originalFile]);

  // 创建转换后图片预览
  useEffect(() => {
    if (conversionResult?.convertedFile) {
      const url = URL.createObjectURL(conversionResult.convertedFile);
      setConvertedPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [conversionResult]);

  if (isConverting) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('imageConverter.preview.converting')}
          </h3>
          <p className="text-gray-500">{t('imageConverter.preview.waiting')}</p>
        </div>
      </div>
    );
  }

  if (!conversionResult) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('imageConverter.preview.previewTitle')}
          </h3>
          <p className="text-gray-500">
            {t('imageConverter.preview.previewDescription')}
          </p>
        </div>
      </div>
    );
  }

  const {
    originalSize,
    convertedSize,
    sizeChange,
    sizeChangeRatio,
    originalFormat,
    targetFormat,
    originalDimensions,
    convertedDimensions,
    conversionTime,
  } = conversionResult;

  const sizeChangeIcon =
    sizeChangeRatio > 0
      ? TrendingUp
      : sizeChangeRatio < 0
        ? TrendingDown
        : Minus;
  const sizeChangeClass =
    sizeChangeRatio > 0
      ? 'positive'
      : sizeChangeRatio < 0
        ? 'negative'
        : 'neutral';

  return (
    <div className="space-y-6">
      {/* 图片对比预览 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t('imageConverter.preview.imageComparison')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 原始图片 */}
          <div className="text-center">
            <div className="mb-2">
              <h4 className="text-sm font-medium text-gray-700">
                {t('imageConverter.preview.originalImage')}
              </h4>
              <p className="text-xs text-gray-500">
                {originalFormat.toUpperCase()}
              </p>
            </div>
            <div className="relative">
              <img
                src={originalPreview}
                alt={t('image.list.preview')}
                className="preview-image"
              />
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {originalDimensions.width} × {originalDimensions.height}
              </div>
            </div>
          </div>

          {/* 转换后图片 */}
          <div className="text-center">
            <div className="mb-2">
              <h4 className="text-sm font-medium text-gray-700">
                {t('imageConverter.preview.convertedImage')}
              </h4>
              <p className="text-xs text-gray-500">
                {targetFormat.toUpperCase()}
              </p>
            </div>
            <div className="relative">
              <img
                src={convertedPreview}
                alt={t('image.list.preview')}
                className="preview-image"
              />
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {convertedDimensions.width} × {convertedDimensions.height}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 转换统计 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t('imageConverter.preview.conversionStats')}
        </h3>

        <div className="conversion-stats">
          <div className="stat-item">
            <div className="stat-value">{formatFileSize(originalSize)}</div>
            <div className="stat-label">
              {t('imageConverter.preview.originalSize')}
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{formatFileSize(convertedSize)}</div>
            <div className="stat-label">
              {t('imageConverter.preview.convertedSize')}
            </div>
          </div>
          <div className="stat-item">
            <div
              className={`stat-value flex items-center justify-center space-x-1 ${sizeChangeClass}`}
            >
              {React.createElement(sizeChangeIcon, { className: 'w-4 h-4' })}
              <span>{Math.abs(sizeChangeRatio).toFixed(1)}%</span>
            </div>
            <div className="stat-label">
              {t('imageConverter.preview.sizeChange')}
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-value flex items-center justify-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{conversionTime.toFixed(0)}ms</span>
            </div>
            <div className="stat-label">
              {t('imageConverter.preview.conversionTime')}
            </div>
          </div>
        </div>
      </div>

      {/* 详细信息 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t('imageConverter.preview.details')}
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">
              {t('imageConverter.preview.originalFormat')}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {originalFormat.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">
              {t('imageConverter.preview.targetFormat')}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {targetFormat.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">
              {t('imageConverter.preview.dimensionChange')}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {originalDimensions.width}×{originalDimensions.height} →{' '}
              {convertedDimensions.width}×{convertedDimensions.height}
            </span>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex space-x-3">
        <button
          onClick={() => onDownload(conversionResult.convertedFile)}
          className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <Download className="w-5 h-5" />
          <span>{t('imageConverter.preview.downloadConverted')}</span>
        </button>
        <button
          onClick={onRetry}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
        >
          <RefreshCw className="w-5 h-5" />
          <span>{t('imageConverter.preview.retryConversion')}</span>
        </button>
      </div>
    </div>
  );
};

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default ImageFormatConversionPreview;
