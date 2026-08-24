import { CircleHelp, Search as SearchIcon } from 'lucide-react';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { defaultTranslate } from '@/ui/locales';
import type { ImageItem } from '@pixuli/core/types';
import type { FilterOptions } from '../../../image/image-browser/common/types';
import SearchBar from './SearchBar';
import './SearchBar.css';
import './Search.css';

export type SearchVariant = 'header' | 'image' | 'basic';

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export interface SearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  /** 输入草稿；未传则与 searchQuery 同步（兼容旧用法） */
  draftQuery?: string;
  onDraftChange?: (query: string) => void;
  /** 回车确认查询 */
  onCommitSearch?: (query?: string) => void;
  variant?: SearchVariant;
  hasConfig?: boolean;
  /** @deprecated 查询语法已取代面板筛选；保留以免破坏调用方类型 */
  images?: ImageItem[];
  /** @deprecated */
  externalFilters?: FilterOptions;
  /** @deprecated */
  onFiltersChange?: (
    filters: FilterOptions | ((prev: FilterOptions) => FilterOptions),
  ) => void;
  /** @deprecated 已忽略 */
  showFilter?: boolean;
  selectedTags?: string[];
  onTagsChange?: (tags: string[]) => void;
  allTags?: string[];
  placeholder?: string;
  disabled?: boolean;
  t?: (key: string) => string;
  className?: string;
  showHistory?: boolean;
  history?: SearchHistoryItem[];
  onSelectHistory?: (query: string) => void;
  onDeleteHistory?: (query: string) => void;
  onClearHistory?: () => void;
  onSaveHistory?: (query: string) => void;
}

const Search: React.FC<SearchProps> = ({
  searchQuery,
  onSearchChange,
  draftQuery,
  onDraftChange,
  onCommitSearch,
  variant = 'basic',
  hasConfig = true,
  selectedTags = [],
  onTagsChange,
  allTags = [],
  placeholder,
  disabled = false,
  t,
  className = '',
  showHistory = false,
  history = [],
  onSelectHistory,
  onDeleteHistory,
  onClearHistory,
  onSaveHistory,
}) => {
  const translate = t || defaultTranslate;
  const inputValue = draftQuery ?? searchQuery;
  const handleInputChange = (value: string) => {
    if (onDraftChange) {
      onDraftChange(value);
      // 清空输入时立即取消已确认查询
      if (value === '') onSearchChange('');
      return;
    }
    onSearchChange(value);
  };
  const handleCommit = (query?: string) => {
    const q = (query ?? inputValue).trim();
    if (onCommitSearch) {
      onCommitSearch(q);
      return;
    }
    onSaveHistory?.(q);
    onSearchChange(q);
  };
  const [searchExpanded, setSearchExpanded] = useState(
    () => inputValue.trim().length > 0,
  );
  const [showHelp, setShowHelp] = useState(false);
  const [helpStyle, setHelpStyle] = useState<React.CSSProperties | undefined>();
  const helpRef = useRef<HTMLDivElement>(null);
  const helpButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (inputValue.trim()) setSearchExpanded(true);
  }, [inputValue]);

  useLayoutEffect(() => {
    if (!showHelp) {
      setHelpStyle(undefined);
      return;
    }
    const update = () => {
      const button = helpButtonRef.current;
      if (!button) return;
      const narrow =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(max-width: 767px)').matches;
      if (narrow) {
        setHelpStyle(undefined);
        return;
      }
      const rect = button.getBoundingClientRect();
      setHelpStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        right: Math.max(8, window.innerWidth - rect.right),
        left: 'auto',
        zIndex: 1100,
      });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [showHelp]);

  useEffect(() => {
    if (!showHelp) return;
    const onPointerDown = (event: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setShowHelp(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [showHelp]);

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    if (variant === 'header') {
      return hasConfig
        ? translate('search.header.placeholder')
        : translate('search.header.placeholderDisabled');
    }
    if (variant === 'image') {
      return translate('search.image.placeholder');
    }
    return translate('search.placeholder') || 'Search...';
  };

  const helpPanel = showHelp ? (
    <div
      className="search-help-panel"
      style={helpStyle}
      role="dialog"
      aria-label={translate('search.help.title')}
    >
      {' '}
      <div className="search-help-title">{translate('search.help.title')}</div>
      <p className="search-help-intro">{translate('search.help.intro')}</p>
      <ul className="search-help-list">
        <li>
          <code>{translate('search.help.exBare')}</code>
          <span>{translate('search.help.descBare')}</span>
        </li>
        <li>
          <code>{translate('search.help.exName')}</code>
          <span>{translate('search.help.descName')}</span>
        </li>
        <li>
          <code>{translate('search.help.exKind')}</code>
          <span>{translate('search.help.descKind')}</span>
        </li>
        <li>
          <code>{translate('search.help.exSize')}</code>
          <span>{translate('search.help.descSize')}</span>
        </li>
        <li>
          <code>{translate('search.help.exCombo')}</code>
          <span>{translate('search.help.descCombo')}</span>
        </li>
      </ul>
    </div>
  ) : null;

  if (variant === 'basic') {
    return (
      <SearchBar
        value={inputValue}
        onChange={handleInputChange}
        placeholder={getPlaceholder()}
        disabled={disabled || !hasConfig}
        showHistory={showHistory}
        history={history}
        onSelectHistory={onSelectHistory}
        onDeleteHistory={onDeleteHistory}
        onClearHistory={onClearHistory}
        onSaveHistory={handleCommit}
      />
    );
  }

  if (variant === 'header') {
    return (
      <div
        className={`search-wrapper search-wrapper--header ${searchExpanded ? 'search-wrapper--expanded' : ''} ${className}`.trim()}
      >
        <button
          type="button"
          className="search-compact-toggle"
          aria-expanded={searchExpanded}
          aria-label={
            searchExpanded
              ? translate('search.header.collapseSearch')
              : translate('search.header.expandSearch')
          }
          title={
            searchExpanded
              ? translate('search.header.collapseSearch')
              : translate('search.header.expandSearch')
          }
          onClick={() => setSearchExpanded(open => !open)}
        >
          <SearchIcon size={18} aria-hidden />
        </button>
        <SearchBar
          value={inputValue}
          onChange={handleInputChange}
          placeholder={getPlaceholder()}
          disabled={!hasConfig}
          showHistory={showHistory}
          history={history}
          onSelectHistory={onSelectHistory}
          onDeleteHistory={onDeleteHistory}
          onClearHistory={onClearHistory}
          onSaveHistory={handleCommit}
        />
        {hasConfig ? (
          <div className="search-help-wrapper" ref={helpRef}>
            <button
              type="button"
              ref={helpButtonRef}
              className={`search-help-button${showHelp ? ' is-open' : ''}`}
              title={translate('search.help.title')}
              aria-label={translate('search.help.title')}
              aria-expanded={showHelp}
              onClick={() => setShowHelp(open => !open)}
            >
              <CircleHelp size={18} aria-hidden />
            </button>
            {helpPanel}
          </div>
        ) : null}
      </div>
    );
  }

  // image variant：保留简易标签筛选（工具页等）
  return (
    <div className={`search-wrapper search-wrapper--image ${className}`.trim()}>
      <SearchBar
        value={inputValue}
        onChange={handleInputChange}
        placeholder={getPlaceholder()}
        disabled={disabled}
        showHistory={showHistory}
        history={history}
        onSelectHistory={onSelectHistory}
        onDeleteHistory={onDeleteHistory}
        onClearHistory={onClearHistory}
        onSaveHistory={handleCommit}
      />
      {onTagsChange && allTags.length > 0 ? (
        <div className="search-tags">
          <div className="search-tags-header">
            <span className="search-tags-label">
              {translate('search.image.filterByTags') || '按标签筛选'}
            </span>
            {selectedTags.length > 0 ? (
              <button
                type="button"
                className="search-tags-clear"
                onClick={() => onTagsChange([])}
              >
                {translate('search.image.clearFilters') || '清除筛选'}
              </button>
            ) : null}
          </div>
          <div className="search-tags-list">
            {allTags.map(tag => {
              const selected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  className={`search-tag-button ${selected ? 'selected' : 'unselected'}`}
                  onClick={() =>
                    onTagsChange(
                      selected
                        ? selectedTags.filter(item => item !== tag)
                        : [...selectedTags, tag],
                    )
                  }
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Search;
