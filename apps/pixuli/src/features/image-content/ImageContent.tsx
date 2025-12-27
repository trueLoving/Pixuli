import {
  EmptyState,
  formatFileSize,
  getImageDimensionsFromUrl,
  ImageBrowser,
} from '@packages/common/src';
import { RefreshCw } from 'lucide-react';
import React from 'react';
import { useImageStore } from '../../stores/imageStore';

interface ImageContentProps {
  hasConfig: boolean;
  error: string | null;
  onClearError: () => void;
  images: any[];
  loading: boolean;
  onDeleteImage: (imageId: string, fileName: string) => Promise<void>;
  onDeleteMultipleImages: (
    imageIds: string[],
    fileNames: string[],
  ) => Promise<void>;
  onUpdateImage: (data: any) => Promise<void>;
  onOpenConfigModal: () => void;
  t: (key: string, options?: Record<string, any>) => string;
}

export const ImageContent: React.FC<ImageContentProps> = ({
  hasConfig,
  error,
  onClearError,
  images,
  loading,
  onDeleteImage,
  onDeleteMultipleImages,
  onUpdateImage,
  onOpenConfigModal,
  t,
}) => {
  if (!hasConfig) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <EmptyState
          onAddGitHub={() => {
            useImageStore.setState({ storageType: 'github' });
            onOpenConfigModal();
          }}
          onAddGitee={() => {
            useImageStore.setState({ storageType: 'gitee' });
            onOpenConfigModal();
          }}
          t={t}
        />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-red-800">
              {error.includes('|')
                ? (() => {
                    const [key, provider] = error.split('|');
                    return t(key, { provider });
                  })()
                : error.startsWith('errors.')
                  ? t(error)
                  : error}
            </p>
            <button
              onClick={onClearError}
              className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 图片统计和操作区域 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('app.imageLibrary')} ({images.length} {t('app.images')})
        </h2>
        {loading && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>{t('app.loadingImages')}</span>
          </div>
        )}
      </div>

      {/* 图片浏览 */}
      <div className="min-h-0">
        <ImageBrowser
          t={t}
          images={images}
          onDeleteImage={onDeleteImage}
          onDeleteMultipleImages={onDeleteMultipleImages}
          onUpdateImage={onUpdateImage}
          getImageDimensionsFromUrl={getImageDimensionsFromUrl}
          formatFileSize={formatFileSize}
        />
      </div>
    </div>
  );
};
