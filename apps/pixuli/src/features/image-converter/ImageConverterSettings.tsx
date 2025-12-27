import { ImageConvertService } from '@/services/imageConvertService';
import { defaultTranslate } from '@packages/common/src';
import { Info, Settings, Zap } from 'lucide-react';
import React, { useState } from 'react';
import zhCN from './locales/zh-CN.json';
import {
  FormatConversionOptions,
  SUPPORTED_FORMATS,
  getFormatInfo,
  supportsLossless,
  supportsTransparency,
} from './types';

interface ImageFormatConversionSettingsProps {
  file: File;
  options: FormatConversionOptions;
  onOptionsChange: (options: FormatConversionOptions) => void;
  onAutoOptimize: () => void;
  t?: (key: string) => string;
}

const dT = (key: string) => {
  return defaultTranslate(key, zhCN);
};

const ImageFormatConversionSettings: React.FC<
  ImageFormatConversionSettingsProps
> = ({ file, options, onOptionsChange, onAutoOptimize, t = dT }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleOptionChange = (
    key: keyof FormatConversionOptions,
    value: any,
  ) => {
    onOptionsChange({
      ...options,
      [key]: value,
    });
  };

  const handleFormatChange = (targetFormat: string) => {
    const newOptions = { ...options, targetFormat: targetFormat as any };

    // 如果新格式不支持透明度，关闭透明度选项
    if (!supportsTransparency(targetFormat as any)) {
      newOptions.preserveTransparency = false;
    }

    // 如果新格式不支持无损压缩，关闭无损选项
    if (!supportsLossless(targetFormat as any)) {
      newOptions.lossless = false;
    }

    onOptionsChange(newOptions);
  };

  const handleAutoOptimize = () => {
    const autoOptions = ImageConvertService.getAutoConversionOptions(
      file,
      options.targetFormat,
    );
    onOptionsChange({ ...options, ...autoOptions });
    onAutoOptimize();
  };

  const fileSizeMB = file.size / (1024 * 1024);
  const isLargeFile = fileSizeMB > 5;
  const targetFormatInfo = getFormatInfo(options.targetFormat);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">
            {t('imageConverter.settings.title')}
          </h3>
        </div>
        <button
          onClick={handleAutoOptimize}
          className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          <Zap className="w-4 h-4" />
          <span>{t('imageConverter.settings.autoOptimize')}</span>
        </button>
      </div>

      {/* 文件信息 */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
          <Info className="w-4 h-4" />
          <span>{t('imageConverter.settings.fileInfo')}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">
              {t('imageConverter.settings.size')}
            </span>
            <span className="ml-1 font-medium">{fileSizeMB.toFixed(2)} MB</span>
          </div>
          <div>
            <span className="text-gray-500">
              {t('imageConverter.settings.type')}
            </span>
            <span className="ml-1 font-medium">{file.type}</span>
          </div>
        </div>
      </div>

      {/* 目标格式选择 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {t('imageConverter.settings.targetFormat')}
        </label>
        <div className="grid grid-cols-2 gap-3">
          {SUPPORTED_FORMATS.map(format => (
            <div
              key={format.format}
              className={`format-option ${
                options.targetFormat === format.format ? 'selected' : ''
              }`}
              onClick={() => handleFormatChange(format.format)}
            >
              <div className="flex items-center space-x-3">
                <div className={`format-icon ${format.format}`}>
                  {format.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{format.name}</div>
                  <div className="text-xs text-gray-500">
                    {format.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 质量设置 */}
      {!options.lossless && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              {t('imageConverter.settings.quality')}
            </label>
            <span className="text-sm text-gray-500">
              {options.quality || 80}%
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={options.quality || 80}
            onChange={e =>
              handleOptionChange('quality', parseInt(e.target.value))
            }
            className="quality-slider"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{t('imageConverter.settings.lowQuality')}</span>
            <span>{t('imageConverter.settings.highQuality')}</span>
          </div>
        </div>
      )}

      {/* 高级选项 */}
      <div className="mb-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>
            {showAdvanced
              ? t('imageConverter.settings.close')
              : t('imageConverter.settings.open')}
            {t('imageConverter.settings.advancedOptions')}
          </span>
        </button>
      </div>

      {showAdvanced && (
        <div className="space-y-4 fade-in">
          {/* 透明度设置 */}
          {supportsTransparency(options.targetFormat) && (
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                {t('imageConverter.settings.preserveTransparency')}
              </label>
              <input
                type="checkbox"
                checked={options.preserveTransparency || false}
                onChange={e =>
                  handleOptionChange('preserveTransparency', e.target.checked)
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
          )}

          {/* 无损压缩 */}
          {supportsLossless(options.targetFormat) && (
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                {t('imageConverter.settings.losslessCompression')}
              </label>
              <input
                type="checkbox"
                checked={options.lossless || false}
                onChange={e => handleOptionChange('lossless', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
          )}

          {/* 颜色空间 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('imageConverter.settings.colorSpace')}
            </label>
            <select
              value={options.colorSpace || 'rgb'}
              onChange={e => handleOptionChange('colorSpace', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="rgb">RGB</option>
              <option value="rgba">RGBA</option>
              <option value="grayscale">
                {t('imageConverter.settings.grayscale')}
              </option>
            </select>
          </div>
        </div>
      )}

      {/* 格式信息提示 */}
      {targetFormatInfo && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <div className="font-medium text-blue-900 mb-1">
                {targetFormatInfo.name}{' '}
                {t('imageConverter.settings.formatInfo')}
              </div>
              <div className="text-blue-700 mb-2">
                {targetFormatInfo.description}
              </div>
              <div className="text-blue-600">
                {t('imageConverter.settings.commonUse')}:{' '}
                {targetFormatInfo.commonUse}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 文件大小建议 */}
      {isLargeFile && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-700">
              <div className="font-medium mb-1">
                {t('imageConverter.settings.largeFileWarning')}
              </div>
              <div>
                {t('imageConverter.settings.largeFileDescription').replace(
                  '{size}',
                  fileSizeMB.toFixed(1),
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageFormatConversionSettings;
