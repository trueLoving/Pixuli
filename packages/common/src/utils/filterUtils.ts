import type { ImageItem } from '../types/image';
import type { FilterOptions } from '../components/image-browser/web/image-filter/ImageFilter';

/**
 * 根据筛选条件过滤图片数组
 * @param images 原始图片数组
 * @param filters 筛选条件
 * @returns 筛选后的图片数组
 */
export function filterImages(
  images: ImageItem[],
  filters: FilterOptions,
): ImageItem[] {
  const { searchTerm, selectedTypes, selectedTags } = filters;

  return images.filter(image => {
    // 搜索词筛选
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        image.name.toLowerCase().includes(searchLower) ||
        image.description?.toLowerCase().includes(searchLower) ||
        image.tags?.some(tag => tag.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;
    }

    // 类型筛选
    if (selectedTypes.length > 0) {
      if (!image.type || !selectedTypes.includes(image.type)) {
        return false;
      }
    }

    // 标签筛选
    if (selectedTags.length > 0) {
      if (!image.tags || !image.tags.some(tag => selectedTags.includes(tag))) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 创建默认筛选条件
 * @returns 默认筛选条件
 */
export function createDefaultFilters(): FilterOptions {
  return {
    searchTerm: '',
    selectedTypes: [],
    selectedTags: [],
  };
}
