import type { AssetItem } from '../types/asset';
import type { SortField, SortOrder } from '../types/asset-browser';

/**
 * 对资源数组进行排序
 * @param assets 资源数组
 * @param sortField 排序字段
 * @param sortOrder 排序顺序
 * @returns 排序后的资源数组
 */
function sortAssets(
  assets: AssetItem[],
  sortField: SortField,
  sortOrder: SortOrder,
): AssetItem[] {
  const sortedAssets = [...assets];

  sortedAssets.sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'createdAt':
        // 按创建时间排序
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        comparison = dateA - dateB;
        break;

      case 'name':
        // 按名称排序（忽略大小写）
        comparison = a.name.localeCompare(b.name, 'zh-CN', {
          sensitivity: 'base',
          numeric: true,
        });
        break;

      case 'size':
        // 按文件大小排序
        comparison = a.size - b.size;
        break;

      default:
        comparison = 0;
    }

    // 根据排序顺序返回结果
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sortedAssets;
}

/**
 * 获取排序后的资源数组（包含默认排序）
 * @param assets 原始资源数组
 * @param sortField 排序字段
 * @param sortOrder 排序顺序
 * @returns 排序后的资源数组
 */
export function getSortedAssets(
  assets: AssetItem[],
  sortField: SortField = 'createdAt',
  sortOrder: SortOrder = 'desc',
): AssetItem[] {
  return sortAssets(assets, sortField, sortOrder);
}
