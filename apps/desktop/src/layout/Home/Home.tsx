import {
  BatchUploadProgress,
  formatFileSize,
  getImageDimensionsFromUrl,
  ImageBrowser,
  ImageItem,
  ImageSearch,
  ImageUpload,
  ImageUploadData,
  MultiImageUploadData,
} from '@packages/ui/src';
import { RefreshCw } from 'lucide-react';
import React from 'react';

interface HomeProps {
  /** 翻译函数 */
  t: (key: string) => string;
  /** 错误信息 */
  error?: string | null;
  /** 清除错误 */
  onClearError: () => void;
  /** 搜索词 */
  searchTerm: string;
  /** 搜索词变化回调 */
  onSearchChange: (term: string) => void;
  /** 选中的标签 */
  selectedTags: string[];
  /** 标签变化回调 */
  onTagsChange: (tags: string[]) => void;
  /** 所有标签 */
  allTags: string[];
  /** 上传图片 */
  onUploadImage: (file: File) => Promise<void>;
  /** 批量上传图片 */
  onUploadMultipleImages: (files: File[]) => Promise<void>;
  /** 是否正在加载 */
  loading: boolean;
  /** 批量上传进度 */
  batchUploadProgress?: BatchUploadProgress | null;
  /** 过滤后的图片列表 */
  filteredImages: ImageItem[];
  /** 删除图片 */
  onDeleteImage: (imageId: string, fileName: string) => Promise<void>;
  /** 更新图片 */
  onUpdateImage: (data: any) => Promise<void>;
}

const Home: React.FC<HomeProps> = ({
  t,
  error,
  onClearError,
  searchTerm,
  onSearchChange,
  selectedTags,
  onTagsChange,
  allTags,
  onUploadImage,
  onUploadMultipleImages,
  loading,
  batchUploadProgress,
  filteredImages,
  onDeleteImage,
  onUpdateImage,
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* 主内容区域 - 可滚动 */}
      <main className="flex-1 overflow-y-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-red-800">{error}</p>
                <button
                  onClick={onClearError}
                  className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* 搜索和过滤区域 */}
          <ImageSearch
            t={t}
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            selectedTags={selectedTags}
            onTagsChange={onTagsChange}
            allTags={allTags}
          />

          {/* 图片上传区域 */}
          <div className="mb-4">
            <ImageUpload
              t={t}
              onUploadImage={(data: ImageUploadData) =>
                onUploadImage(data.file)
              }
              onUploadMultipleImages={(data: MultiImageUploadData) =>
                onUploadMultipleImages(data.files)
              }
              loading={loading}
              batchUploadProgress={batchUploadProgress}
            />
          </div>

          {/* 图片统计和操作区域 */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('image.library')} ({filteredImages.length} {t('image.count')})
            </h2>
            {loading && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t('common.loading')}</span>
              </div>
            )}
          </div>

          {/* 图片浏览 */}
          <div className="min-h-0">
            <ImageBrowser
              t={t}
              images={filteredImages}
              onDeleteImage={onDeleteImage}
              onUpdateImage={onUpdateImage}
              getImageDimensionsFromUrl={getImageDimensionsFromUrl}
              formatFileSize={formatFileSize}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
