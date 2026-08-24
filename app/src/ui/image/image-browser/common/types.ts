export type {
  AssetKind,
  FilterOptions,
  SortField,
  SortOrder,
  ViewMode,
} from '@pixuli/core/types';

import type { FilterOptions } from '@pixuli/core/types';

export interface LibrarySearchConfig {
  /** 已确认查询（用于过滤结果） */
  searchQuery: string;
  /** 输入框草稿 */
  draftQuery: string;
  onDraftChange: (query: string) => void;
  /** 回车确认查询 */
  onCommitSearch: (query?: string) => void;
  /** 同时清空草稿与已确认查询等 */
  onSearchChange: (query: string) => void;
  filters: FilterOptions;
  onFiltersChange: (
    filters: FilterOptions | ((prev: FilterOptions) => FilterOptions),
  ) => void;
  history?: Array<{ query: string; timestamp: number }>;
  onSelectHistory?: (query: string) => void;
  onDeleteHistory?: (query: string) => void;
  onClearHistory?: () => void;
}
