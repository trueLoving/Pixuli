export type {
  FilterOptions,
  SortField,
  SortOrder,
  ViewMode,
} from '@pixuli/core/types';

import type { FilterOptions } from '@pixuli/core/types';

export interface LibrarySearchConfig {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: FilterOptions;
  onFiltersChange: (
    filters: FilterOptions | ((prev: FilterOptions) => FilterOptions),
  ) => void;
  history?: Array<{ query: string; timestamp: number }>;
  onSelectHistory?: (query: string) => void;
  onDeleteHistory?: (query: string) => void;
  onClearHistory?: () => void;
  onSaveHistory?: (query: string) => void;
}
