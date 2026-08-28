/**
 * 搜索上下文
 * 输入框为草稿；回车后才提交为生效查询并过滤资源库。
 */

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import type { FilterOptions } from '@pixuli/core/types';
import { createDefaultFilters } from '@pixuli/core/utils';
import {
  getSearchHistory,
  addSearchHistory,
  removeSearchHistory,
  clearSearchHistory,
  type SearchHistoryItem,
} from './utils/searchHistory';

interface SearchContextValue {
  /** 输入框草稿（未回车） */
  draftQuery: string;
  setDraftQuery: (query: string) => void;
  /** 已确认、用于过滤的查询 */
  searchQuery: string;
  /** 同时更新草稿与已确认查询（清空 / 选历史等） */
  setSearchQuery: (query: string) => void;
  /** 回车确认：以当前草稿（或传入值）生效并写入历史 */
  commitSearch: (query?: string) => void;
  filters: FilterOptions;
  setFilters: (
    filters: FilterOptions | ((prev: FilterOptions) => FilterOptions),
  ) => void;
  history: SearchHistoryItem[];
  handleSelectHistory: (query: string) => void;
  handleDeleteHistory: (query: string) => void;
  handleClearHistory: () => void;
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export const useSearchContext = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearchContext must be used within SearchProvider');
  }
  return context;
};

export const useSearchContextSafe = () => {
  return useContext(SearchContext);
};

interface SearchProviderProps {
  children: ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [draftQuery, setDraftQuery] = useState('');
  const [searchQuery, setSearchQueryState] = useState('');
  const [filters, setFilters] = useState<FilterOptions>(createDefaultFilters());
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setDraftQuery(query);
    setSearchQueryState(query);
  }, []);

  const commitSearch = useCallback(
    (query?: string) => {
      const q = (query ?? draftQuery).trim();
      setDraftQuery(q);
      setSearchQueryState(q);
      if (q.length > 0) {
        addSearchHistory(q);
        setHistory(getSearchHistory());
      }
    },
    [draftQuery],
  );

  const handleSelectHistory = useCallback((query: string) => {
    setDraftQuery(query);
    setSearchQueryState(query);
    addSearchHistory(query);
    setHistory(getSearchHistory());
  }, []);

  const handleDeleteHistory = useCallback((query: string) => {
    removeSearchHistory(query);
    setHistory(getSearchHistory());
  }, []);

  const handleClearHistory = useCallback(() => {
    clearSearchHistory();
    setHistory([]);
  }, []);

  return (
    <SearchContext.Provider
      value={{
        draftQuery,
        setDraftQuery,
        searchQuery,
        setSearchQuery,
        commitSearch,
        filters,
        setFilters,
        history,
        handleSelectHistory,
        handleDeleteHistory,
        handleClearHistory,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
