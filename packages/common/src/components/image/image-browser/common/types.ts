/**
 * ImageBrowser 组件共享类型定义
 */

export interface FilterOptions {
  searchTerm: string;
  selectedTypes: string[];
  selectedTags: string[];
}

export type SortField = 'createdAt' | 'name' | 'size';
export type SortOrder = 'asc' | 'desc';

export type ViewMode = 'grid' | 'list';
