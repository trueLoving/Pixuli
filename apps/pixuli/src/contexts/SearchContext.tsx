/**
 * 搜索上下文
 * 用于在 Header 中显示搜索框
 */

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import { FilterOptions, createDefaultFilters } from '@packages/common/src';
import {
  getSearchHistory,
  addSearchHistory,
  removeSearchHistory,
  clearSearchHistory,
  type SearchHistoryItem,
} from '../utils/searchHistory';

interface SearchContextValue {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: FilterOptions;
  setFilters: (
    filters: FilterOptions | ((prev: FilterOptions) => FilterOptions),
  ) => void;
  showSearch: boolean;
  setShowSearch: (show: boolean) => void;
  history: SearchHistoryItem[];
  handleSelectHistory: (query: string) => void;
  handleDeleteHistory: (query: string) => void;
  handleClearHistory: () => void;
  handleSaveHistory: (query: string) => void;
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export const useSearchContext = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearchContext must be used within SearchProvider');
  }
  return context;
};

/**
 * 安全地使用搜索上下文，如果不存在则返回 null
 */
export const useSearchContextSafe = () => {
  return useContext(SearchContext);
};

interface SearchProviderProps {
  children: ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>(createDefaultFilters());
  const [showSearch, setShowSearch] = useState(false);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // 加载历史记录
  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  // 处理搜索查询变化
  const handleSearchQueryChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // 手动保存搜索历史记录（在用户按下 Enter 或执行搜索时调用）
  const handleSaveHistory = useCallback((query: string) => {
    if (!query || query.trim().length === 0) {
      return;
    }
    addSearchHistory(query.trim());
    setHistory(getSearchHistory());
  }, []);

  // 选择历史记录
  const handleSelectHistory = useCallback((query: string) => {
    setSearchQuery(query);
    // 选择历史记录时也保存（更新到最新）
    addSearchHistory(query);
    setHistory(getSearchHistory());
  }, []);

  // 删除单条历史记录
  const handleDeleteHistory = useCallback((query: string) => {
    removeSearchHistory(query);
    setHistory(getSearchHistory());
  }, []);

  // 清空所有历史记录
  const handleClearHistory = useCallback(() => {
    clearSearchHistory();
    setHistory([]);
  }, []);

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery: handleSearchQueryChange,
        filters,
        setFilters,
        showSearch,
        setShowSearch,
        history,
        handleSelectHistory,
        handleDeleteHistory,
        handleClearHistory,
        handleSaveHistory,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
