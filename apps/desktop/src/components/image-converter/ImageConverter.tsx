import { ImageConvertService } from '@/services/imageConvertService';
import {
  DEFAULT_CONVERSION_OPTIONS,
  FormatConversionOptions,
  FormatConversionResult,
  getFormatFromExtension,
  isImageFile,
} from '@/types/imageConvert';
import {
  defaultTranslate,
  showError,
  showInfo,
  showSuccess,
  useEscapeKey,
} from '@packages/ui/src';
import { FileImage, RefreshCw, Upload, X } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import './ImageConverter.css';
import ImageFormatConversionPreview from './ImageConverterPreview';
import ImageFormatConversionSettings from './ImageConverterSettings';
import zhCN from './locales/zh-CN.json';

interface ImageFormatConversionProps {
  isOpen: boolean;
  onClose: () => void;
  t?: (key: string) => string;
}

const dT = (key: string) => {
  return defaultTranslate(key, zhCN);
};

const ImageFormatConversion: React.FC<ImageFormatConversionProps> = ({
  isOpen,
  onClose,
  t = dT,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [conversionOptions, setConversionOptions] =
    useState<FormatConversionOptions>(DEFAULT_CONVERSION_OPTIONS);
  const [conversionResult, setConversionResult] =
    useState<FormatConversionResult | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // 处理文件选择
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        if (!isImageFile(file)) {
          showError(t('common.error'));
          return;
        }

        if (file.size > 50 * 1024 * 1024) {
          // 50MB限制
          showError(t('common.error'));
          return;
        }

        setSelectedFile(file);
        setConversionResult(null);

        // 自动检测原格式并设置目标格式
        const originalFormat = getFormatFromExtension(file.name);
        if (originalFormat) {
          const autoOptions = ImageConvertService.getAutoConversionOptions(
            file,
            'webp'
          );
          setConversionOptions({
            ...DEFAULT_CONVERSION_OPTIONS,
            ...autoOptions,
            targetFormat: 'webp', // 默认转换为 WebP
          });
        }

        showInfo(`已选择图片: ${file.name}`);
      }
    },
    []
  );

  // 处理拖拽
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);

    if (files.length > 1) {
      showError(t('common.error'));
      return;
    }

    const file = files[0];
    if (file && isImageFile(file)) {
      if (file.size > 50 * 1024 * 1024) {
        showError(t('common.error'));
        return;
      }

      setSelectedFile(file);
      setConversionResult(null);

      // 自动检测原格式并设置目标格式
      const originalFormat = getFormatFromExtension(file.name);
      if (originalFormat) {
        const autoOptions = ImageConvertService.getAutoConversionOptions(
          file,
          'webp'
        );
        setConversionOptions({
          ...DEFAULT_CONVERSION_OPTIONS,
          ...autoOptions,
          targetFormat: 'webp', // 默认转换为 WebP
        });
      }

      showInfo(`已选择图片: ${file.name}`);
    } else {
      showError(t('common.error'));
    }
  }, []);

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    []
  );

  // 执行格式转换
  const handleConvert = useCallback(async () => {
    if (!selectedFile) return;

    setIsConverting(true);
    try {
      const result = await ImageConvertService.convertImage(
        selectedFile,
        conversionOptions
      );
      setConversionResult(result);

      if (result.sizeChangeRatio > 0) {
        showSuccess(
          `转换成功！文件大小增加了 ${result.sizeChangeRatio.toFixed(1)}%`
        );
      } else if (result.sizeChangeRatio < 0) {
        showSuccess(
          `转换成功！文件大小减少了 ${Math.abs(result.sizeChangeRatio).toFixed(1)}%`
        );
      } else {
        showInfo(t('common.success'));
      }
    } catch (error) {
      showError(
        `格式转换失败: ${error instanceof Error ? error.message : t('common.unknownError')}`
      );
    } finally {
      setIsConverting(false);
    }
  }, [selectedFile, conversionOptions]);

  // 下载转换后的图片
  const handleDownload = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccess(t('common.success'));
  }, []);

  // 重新转换
  const handleRetry = useCallback(() => {
    setConversionResult(null);
  }, []);

  // 自动优化
  const handleAutoOptimize = useCallback(() => {
    if (selectedFile) {
      const autoOptions = ImageConvertService.getAutoConversionOptions(
        selectedFile,
        conversionOptions.targetFormat
      );
      setConversionOptions(prev => ({ ...prev, ...autoOptions }));
      showInfo(t('common.success'));
    }
  }, [selectedFile, conversionOptions.targetFormat]);

  // 键盘支持
  useEscapeKey(onClose);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {t('imageConverter.title')}
              </h2>
              <p className="text-sm text-gray-500">
                {t('imageConverter.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：文件选择和设置 */}
            <div className="space-y-6">
              {/* 文件上传区域 */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {t('imageConverter.fileSelect.title')}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {t('imageConverter.fileSelect.placeholder')}
                    </p>
                    <p className="text-sm text-gray-400">
                      {t('imageConverter.fileSelect.supportedFormats')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 文件信息 */}
              {selectedFile && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <FileImage className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-gray-900">
                      {t('imageConverter.fileInfo.title')}
                    </h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {t('imageConverter.fileInfo.fileName')}
                      </span>
                      <span className="text-gray-900 font-medium">
                        {selectedFile.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {t('imageConverter.fileInfo.fileSize')}
                      </span>
                      <span className="text-gray-900">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {t('imageConverter.fileInfo.fileType')}
                      </span>
                      <span className="text-gray-900">{selectedFile.type}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 转换设置 */}
              {selectedFile && (
                <ImageFormatConversionSettings
                  t={t}
                  file={selectedFile}
                  options={conversionOptions}
                  onOptionsChange={setConversionOptions}
                  onAutoOptimize={handleAutoOptimize}
                />
              )}

              {/* 转换按钮 */}
              {selectedFile && (
                <div className="flex space-x-3">
                  <button
                    onClick={handleConvert}
                    disabled={isConverting}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    {isConverting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>{t('imageConverter.conversion.converting')}</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        <span>{t('imageConverter.conversion.start')}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* 右侧：预览和结果 */}
            <div>
              <ImageFormatConversionPreview
                t={t}
                originalFile={selectedFile}
                conversionResult={conversionResult}
                isConverting={isConverting}
                onDownload={handleDownload}
                onRetry={handleRetry}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageFormatConversion;
