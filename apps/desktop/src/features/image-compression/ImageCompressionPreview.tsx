import {
  CompressionResult,
  formatFileSize,
} from '@/services/imageCompressService';
import { defaultTranslate } from '@packages/common/src';
import {
  AlertCircle,
  CheckCircle,
  Download,
  Eye,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import zhCN from './locales/zh-CN.json';

interface ImageCompressionPreviewProps {
  originalFile: File;
  compressionResult: CompressionResult | null;
  isCompressing: boolean;
  onDownload: (file: File) => void;
  onRetry: () => void;
  t?: (key: string) => string;
}

const dT = (key: string) => {
  return defaultTranslate(key, zhCN);
};

const ImageCompressionPreview: React.FC<ImageCompressionPreviewProps> = ({
  originalFile,
  compressionResult,
  isCompressing,
  onDownload,
  onRetry,
  t = dT,
}) => {
  const [originalPreview, setOriginalPreview] = useState<string>('');
  const [compressedPreview, setCompressedPreview] = useState<string>('');

  // 创建预览URL
  useEffect(() => {
    if (originalFile) {
      const url = URL.createObjectURL(originalFile);
      setOriginalPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [originalFile]);

  useEffect(() => {
    if (compressionResult?.compressedFile) {
      const url = URL.createObjectURL(compressionResult.compressedFile);
      setCompressedPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [compressionResult]);

  if (isCompressing) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('imageCompression.preview.compressing')}
          </h3>
          <p className="text-gray-500">
            {t('imageCompression.preview.waiting')}
          </p>
        </div>
      </div>
    );
  }

  if (!compressionResult) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('imageCompression.preview.previewTitle')}
          </h3>
          <p className="text-gray-500">
            {t('imageCompression.preview.previewDescription')}
          </p>
        </div>
      </div>
    );
  }

  const {
    originalSize,
    compressedSize,
    compressionRatio,
    originalDimensions,
    compressedDimensions,
  } = compressionResult;

  const sizeReduction = originalSize - compressedSize;
  const isCompressionSuccessful = compressionRatio > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          {t('imageCompression.preview.resultTitle')}
        </h3>
        {isCompressionSuccessful ? (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              {t('imageCompression.preview.success')}
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-orange-600">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              {t('imageCompression.preview.noNeed')}
            </span>
          </div>
        )}
      </div>

      {/* 压缩统计 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatFileSize(originalSize)}
            </div>
            <div className="text-sm text-gray-500">
              {t('imageCompression.preview.originalSize')}
            </div>
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatFileSize(compressedSize)}
            </div>
            <div className="text-sm text-blue-600">
              {t('imageCompression.preview.compressedSize')}
            </div>
          </div>
        </div>
      </div>

      {/* 压缩效果 */}
      {isCompressionSuccessful && (
        <div className="bg-green-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                {t('imageCompression.preview.compressionEffect')}
              </span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">
                -{compressionRatio.toFixed(1)}%
              </div>
              <div className="text-xs text-green-600">
                {t('imageCompression.preview.saved')}{' '}
                {formatFileSize(sizeReduction)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 图片对比 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* 原始图片 */}
        <div className="text-center">
          <div className="bg-gray-100 rounded-lg p-2 mb-2">
            <img
              src={originalPreview}
              alt={t('image.list.preview')}
              className="w-full h-32 object-contain rounded"
            />
          </div>
          <div className="text-xs text-gray-600">
            <div className="font-medium">
              {t('imageCompression.preview.originalImage')}
            </div>
            <div>
              {originalDimensions.width} × {originalDimensions.height}
            </div>
            <div>{formatFileSize(originalSize)}</div>
          </div>
        </div>

        {/* 压缩后图片 */}
        <div className="text-center">
          <div className="bg-blue-100 rounded-lg p-2 mb-2">
            <img
              src={compressedPreview}
              alt={t('image.list.preview')}
              className="w-full h-32 object-contain rounded"
            />
          </div>
          <div className="text-xs text-blue-600">
            <div className="font-medium">
              {t('imageCompression.preview.compressedImage')}
            </div>
            <div>
              {compressedDimensions.width} × {compressedDimensions.height}
            </div>
            <div>{formatFileSize(compressedSize)}</div>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex space-x-3">
        <button
          onClick={() => onDownload(compressionResult.compressedFile)}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>{t('imageCompression.preview.downloadCompressed')}</span>
        </button>
        <button
          onClick={onRetry}
          className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t('imageCompression.preview.retryCompression')}</span>
        </button>
      </div>

      {/* 详细信息 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>{t('imageCompression.preview.fileName')}</span>
            <span className="font-medium">
              {compressionResult.compressedFile.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span>{t('imageCompression.preview.fileType')}</span>
            <span className="font-medium">
              {compressionResult.compressedFile.type}
            </span>
          </div>
          <div className="flex justify-between">
            <span>{t('imageCompression.preview.compressionRatio')}</span>
            <span className="font-medium">{compressionRatio.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span>{t('imageCompression.preview.dimensionChange')}</span>
            <span className="font-medium">
              {originalDimensions.width}×{originalDimensions.height} →{' '}
              {compressedDimensions.width}×{compressedDimensions.height}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCompressionPreview;
