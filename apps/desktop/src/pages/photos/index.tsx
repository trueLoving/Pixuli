import React, { useState, useEffect, useMemo } from 'react';
import { ImageContent } from '../../features/image-content/ImageContent';
import {
  Search,
  createDefaultFilters,
  filterImages,
  type FilterOptions,
} from '@packages/common/src';
import { useImageStore } from '../../stores/imageStore';
import { useSourceStore } from '../../stores/sourceStore';
import { useI18n } from '../../i18n/useI18n';
import { useImageOperations } from '../../hooks/useImageOperations';
import { useUIState } from '../../hooks/useUIState';

export const PhotosPage: React.FC = () => {
  const { t } = useI18n();
  const { images, loading, error, clearError } = useImageStore();
  const { sources } = useSourceStore();
  const { handleDeleteImage, handleDeleteMultipleImages, handleUpdateImage } =
    useImageOperations();
  const { handleOpenConfigModal, searchQuery, setSearchQuery } = useUIState();

  const hasConfig = sources.length > 0;

  // 筛选条件
  const [externalFilters, setExternalFilters] = useState<FilterOptions>(
    createDefaultFilters(),
  );

  // 同步搜索查询到筛选条件
  useEffect(() => {
    setExternalFilters((prev: FilterOptions) => ({
      ...prev,
      searchTerm: searchQuery,
    }));
  }, [searchQuery]);

  // 计算筛选后的图片
  const filteredImages = useMemo(() => {
    return filterImages(images, externalFilters);
  }, [images, externalFilters]);

  return (
    <div className="photos-page h-full flex flex-col overflow-hidden">
      {/* 搜索栏 */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200 bg-white flex-shrink-0">
        <Search
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          variant="header"
          hasConfig={hasConfig}
          images={images}
          externalFilters={externalFilters}
          onFiltersChange={setExternalFilters}
          showFilter={true}
          t={t}
        />
      </div>
      {/* 图片内容 */}
      <div className="flex-1 overflow-y-auto">
        <ImageContent
          hasConfig={hasConfig}
          error={error}
          onClearError={clearError}
          images={filteredImages}
          loading={loading}
          onDeleteImage={handleDeleteImage}
          onDeleteMultipleImages={handleDeleteMultipleImages}
          onUpdateImage={handleUpdateImage}
          onOpenConfigModal={handleOpenConfigModal}
          t={t}
        />
      </div>
    </div>
  );
};

export default PhotosPage;
