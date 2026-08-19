/**
 * 图片浏览/筛选相关共享类型（Web / Mobile）
 */

export type AssetKind = 'image' | 'video' | 'pdf' | 'other';

export interface FilterOptions {
  searchTerm: string;
  selectedTypes: string[];
  selectedTags: string[];
  /** 资源类型：空数组表示全部 */
  selectedKinds?: AssetKind[];
}

export type SortField = 'createdAt' | 'name' | 'size';
export type SortOrder = 'asc' | 'desc';

export type ViewMode = 'grid' | 'list';
