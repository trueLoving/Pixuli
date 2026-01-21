import { useSearchContextSafe } from '@/contexts/SearchContext';
import { ImageContent } from '@/features/image-content/ImageContent';
import { useImageOperations } from '@/hooks/useImageOperations';
import { useI18n } from '@/i18n/useI18n';
import { useImageStore } from '@/stores/imageStore';
import { useSourceStore } from '@/stores/sourceStore';
import { createDefaultFilters, filterImages } from '@packages/common/src';
import React, { useEffect, useMemo, useRef } from 'react';

interface PhotosPageProps {
  onOpenConfigModal: () => void;
}

export const PhotosPage: React.FC<PhotosPageProps> = ({
  onOpenConfigModal,
}) => {
  const { t } = useI18n();
  const { images, loading, error, clearError } = useImageStore();
  const { sources } = useSourceStore();
  const { handleDeleteImage, handleDeleteMultipleImages, handleUpdateImage } =
    useImageOperations();
  const searchContext = useSearchContextSafe();
  const searchContextRef = useRef(searchContext);

  // 更新 ref 以保持最新值
  useEffect(() => {
    searchContextRef.current = searchContext;
  }, [searchContext]);

  const hasConfig = sources.length > 0;

  // 页面加载时显示搜索框
  useEffect(() => {
    if (searchContextRef.current) {
      searchContextRef.current.setShowSearch(true);
      return () => {
        if (searchContextRef.current) {
          searchContextRef.current.setShowSearch(false);
        }
      };
    }
  }, []);

  // 同步搜索查询到筛选条件
  const searchQuery = searchContext?.searchQuery ?? '';
  const setFiltersRef = useRef(searchContext?.setFilters);

  useEffect(() => {
    setFiltersRef.current = searchContext?.setFilters;
  }, [searchContext?.setFilters]);

  useEffect(() => {
    if (!setFiltersRef.current) return;

    const currentQuery = searchQuery;
    setFiltersRef.current(prev => {
      // 只有当 searchTerm 不同时才更新，避免无限循环
      if (prev.searchTerm === currentQuery) {
        return prev;
      }
      return {
        ...prev,
        searchTerm: currentQuery,
      };
    });
  }, [searchQuery]);

  // 计算筛选后的图片
  const filteredImages = useMemo(() => {
    if (!searchContext) {
      return filterImages(images, createDefaultFilters());
    }
    return filterImages(images, searchContext.filters);
  }, [images, searchContext]);

  return (
    <div className="photos-page h-full flex flex-col overflow-hidden">
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
          onOpenConfigModal={onOpenConfigModal}
          t={t}
        />
      </div>
    </div>
  );
};

export default PhotosPage;
