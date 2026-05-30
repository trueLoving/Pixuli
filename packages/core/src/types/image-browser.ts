/**
 * 图片浏览/筛选相关共享类型（Web / Mobile）
 */

export interface FilterOptions {
  searchTerm: string;
  selectedTypes: string[];
  selectedTags: string[];
}

export type SortField = 'createdAt' | 'name' | 'size';
export type SortOrder = 'asc' | 'desc';

export type ViewMode = 'grid' | 'list';
