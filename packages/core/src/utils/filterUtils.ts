import type { AssetItem } from '../types/asset';
import type { FilterOptions } from '../types/asset-browser';

/**
 * 根据筛选条件过滤资源数组
 * @param assets 原始资源数组
 * @param filters 筛选条件
 * @returns 筛选后的资源数组
 */
export function filterAssets(
  assets: AssetItem[],
  filters: FilterOptions,
): AssetItem[] {
  const { searchTerm, selectedTypes, selectedTags } = filters;

  return assets.filter(asset => {
    // 搜索词筛选
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        asset.name.toLowerCase().includes(searchLower) ||
        asset.description?.toLowerCase().includes(searchLower) ||
        asset.tags?.some(tag => tag.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;
    }

    // 类型筛选
    if (selectedTypes.length > 0) {
      if (!asset.type || !selectedTypes.includes(asset.type)) {
        return false;
      }
    }

    // 标签筛选
    if (selectedTags.length > 0) {
      if (!asset.tags || !asset.tags.some(tag => selectedTags.includes(tag))) {
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
    selectedKinds: [],
  };
}
