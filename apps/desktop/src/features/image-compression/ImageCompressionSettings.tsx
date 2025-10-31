import {
  CompressionOptions,
  formatFileSize,
  getAutoCompressionOptions,
} from '@/services/imageCompressService';
import { defaultTranslate } from '@packages/ui/src';
import { FileImage, HardDrive, Info, Settings, Zap } from 'lucide-react';
import React, { useState } from 'react';
import zhCN from './locales/zh-CN.json';

interface ImageCompressionSettingsProps {
  file: File;
  options: CompressionOptions;
  onOptionsChange: (options: CompressionOptions) => void;
  onAutoOptimize: () => void;
  t?: (key: string) => string;
}

const dT = (key: string) => {
  return defaultTranslate(key, zhCN);
};

const ImageCompressionSettings: React.FC<ImageCompressionSettingsProps> = ({
  file,
  options,
  onOptionsChange,
  onAutoOptimize,
  t = dT,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleOptionChange = (key: keyof CompressionOptions, value: any) => {
    onOptionsChange({
      ...options,
      [key]: value,
    });
  };

  const handleAutoOptimize = () => {
    const autoOptions = getAutoCompressionOptions(file.size);
    onOptionsChange(autoOptions);
    onAutoOptimize();
  };

  const fileSizeMB = file.size / (1024 * 1024);
  const isLargeFile = fileSizeMB > 5;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">
            {t('imageCompression.settings.title')}
          </h3>
        </div>
        <button
          onClick={handleAutoOptimize}
          className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          <Zap className="w-4 h-4" />
          <span>{t('imageCompression.settings.autoOptimize')}</span>
        </button>
      </div>

      {/* 文件信息 */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
          <FileImage className="w-4 h-4" />
          <span className="font-medium">
            {t('imageCompression.settings.fileInfo')}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-500">
              {t('imageCompression.settings.fileName')}
            </span>
            <div className="font-medium truncate">{file.name}</div>
          </div>
          <div>
            <span className="text-gray-500">
              {t('imageCompression.settings.fileSize')}
            </span>
            <div className="font-medium">{formatFileSize(file.size)}</div>
          </div>
          <div>
            <span className="text-gray-500">
              {t('imageCompression.settings.fileType')}
            </span>
            <div className="font-medium">
              {file.type || t('common.unknownError')}
            </div>
          </div>
          <div>
            <span className="text-gray-500">
              {t('imageCompression.settings.status')}
            </span>
            <div
              className={`font-medium ${isLargeFile ? 'text-orange-600' : 'text-green-600'}`}
            >
              {isLargeFile ? t('common.warning') : t('common.success')}
            </div>
          </div>
        </div>
      </div>

      {/* WebP 压缩设置 */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('imageCompression.settings.quality')}
          </label>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={options.quality || 80}
            onChange={e =>
              handleOptionChange('quality', parseInt(e.target.value))
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{t('imageCompression.settings.lowQuality')}</span>
            <span className="font-medium">{options.quality || 80}%</span>
            <span>{t('imageCompression.settings.highQuality')}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="lossless"
            checked={options.lossless || false}
            onChange={e => handleOptionChange('lossless', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="lossless" className="text-sm text-gray-700">
            {t('imageCompression.settings.lossless')}
          </label>
        </div>

        {/* 高级选项 */}
        <div className="pt-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span>
              {showAdvanced
                ? t('imageCompression.settings.close')
                : t('imageCompression.settings.open')}{' '}
              {t('imageCompression.settings.advancedOptions')}
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-3 pt-2 border-t border-gray-200">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">
                    {t('imageCompression.settings.webpDescription')}
                  </p>
                  <ul className="space-y-1 text-xs">
                    <li>• {t('imageCompression.settings.qualityTip1')}</li>
                    <li>• {t('imageCompression.settings.qualityTip2')}</li>
                    <li>• {t('imageCompression.settings.qualityTip3')}</li>
                    <li>• {t('imageCompression.settings.qualityTip4')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 提示信息 */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <HardDrive className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">
              {t('imageCompression.settings.compressionTip')}
            </p>
            <p className="text-xs">{t('imageCompression.settings.wasmTip')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCompressionSettings;
