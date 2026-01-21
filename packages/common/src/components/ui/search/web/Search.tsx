import { Filter } from 'lucide-react';
import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from 'react';
import { defaultTranslate } from '../../../../locales';
import type { ImageItem } from '../../../../types/image';
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
  /** 搜索关键词 */
  searchQuery: string;
  /** 搜索关键词变化回调 */
  onSearchChange: (query: string) => void;
  /** 组件变体：header（Header中使用）、image（图片搜索）、basic（仅搜索框） */
  variant?: SearchVariant;
  /** 是否有配置（用于控制搜索框是否禁用） */
  hasConfig?: boolean;
  /** 图片列表（用于筛选功能） */
  images?: ImageItem[];
  /** 外部筛选条件（用于与Header筛选同步） */
  externalFilters?: FilterOptions;
  /** 筛选条件变化回调 */
  onFiltersChange?: (
    filters: FilterOptions | ((prev: FilterOptions) => FilterOptions),
  ) => void;
  /** 是否显示筛选功能 */
  showFilter?: boolean;
  /** 标签相关（仅 image variant 使用） */
  selectedTags?: string[];
  onTagsChange?: (tags: string[]) => void;
  allTags?: string[];
  /** 占位符文本 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 翻译函数 */
  t?: (key: string) => string;
  /** 自定义 CSS 类名 */
  className?: string;
  /** 是否显示历史记录 */
  showHistory?: boolean;
  /** 历史记录数据 */
  history?: SearchHistoryItem[];
  /** 选择历史记录回调 */
  onSelectHistory?: (query: string) => void;
  /** 删除历史记录回调 */
  onDeleteHistory?: (query: string) => void;
  /** 清空历史记录回调 */
  onClearHistory?: () => void;
  /** 保存历史记录回调（按下 Enter 时调用） */
  onSaveHistory?: (query: string) => void;
}

const Search: React.FC<SearchProps> = ({
  searchQuery,
  onSearchChange,
  variant = 'basic',
  hasConfig = true,
  images = [],
  externalFilters,
  onFiltersChange,
  showFilter = false,
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
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  // 获取所有可用的图片类型
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    images.forEach(image => {
      if (image.type) {
        types.add(image.type);
      }
    });
    return Array.from(types).sort();
  }, [images]);

  // 获取所有可用的标签
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    images.forEach(image => {
      if (image.tags && image.tags.length > 0) {
        image.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [images]);

  // 处理类型筛选变化
  const handleTypeChange = useCallback(
    (type: string, isSelected: boolean) => {
      if (!onFiltersChange || !externalFilters) return;
      onFiltersChange((prev: FilterOptions) => {
        const newSelectedTypes = isSelected
          ? [...prev.selectedTypes, type]
          : prev.selectedTypes.filter((t: string) => t !== type);
        return {
          ...prev,
          selectedTypes: newSelectedTypes,
        };
      });
    },
    [onFiltersChange, externalFilters],
  );

  // 处理标签筛选变化
  const handleTagChange = useCallback(
    (tag: string, isSelected: boolean) => {
      if (!onFiltersChange || !externalFilters) return;
      onFiltersChange((prev: FilterOptions) => {
        const newSelectedTags = isSelected
          ? [...prev.selectedTags, tag]
          : prev.selectedTags.filter((t: string) => t !== tag);
        return {
          ...prev,
          selectedTags: newSelectedTags,
        };
      });
    },
    [onFiltersChange, externalFilters],
  );

  // 清除所有筛选条件（保留搜索词）
  const handleClearAll = useCallback(() => {
    if (!onFiltersChange || !externalFilters) return;
    onFiltersChange({
      ...externalFilters,
      selectedTypes: [],
      selectedTags: [],
    });
  }, [onFiltersChange, externalFilters]);

  // 处理标签切换（image variant 使用）
  const handleTagToggle = useCallback(
    (tag: string) => {
      if (!onTagsChange) return;
      onTagsChange(
        selectedTags.includes(tag)
          ? selectedTags.filter(t => t !== tag)
          : [...selectedTags, tag],
      );
    },
    [selectedTags, onTagsChange],
  );

  const handleClearTags = useCallback(() => {
    if (!onTagsChange) return;
    onTagsChange([]);
  }, [onTagsChange]);

  // 点击外部关闭筛选面板
  useEffect(() => {
    if (!showFilterPanel) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterPanelRef.current &&
        !filterPanelRef.current.contains(event.target as Node)
      ) {
        setShowFilterPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterPanel]);

  // 检查是否有活动的筛选条件
  const hasActiveFilters =
    externalFilters &&
    (externalFilters.selectedTypes.length > 0 ||
      externalFilters.selectedTags.length > 0);

  // 获取占位符文本
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

  // 基础搜索框（basic variant）
  if (variant === 'basic') {
    return (
      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        placeholder={getPlaceholder()}
        disabled={disabled || !hasConfig}
        showHistory={showHistory}
        history={history}
        onSelectHistory={onSelectHistory}
        onDeleteHistory={onDeleteHistory}
        onClearHistory={onClearHistory}
        onSaveHistory={onSaveHistory}
      />
    );
  }

  // Header variant：搜索框 + 筛选面板
  if (variant === 'header') {
    return (
      <div className={`search-wrapper search-wrapper--header ${className}`}>
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={getPlaceholder()}
          disabled={!hasConfig}
          showHistory={showHistory}
          history={history}
          onSelectHistory={onSelectHistory}
          onDeleteHistory={onDeleteHistory}
          onClearHistory={onClearHistory}
          onSaveHistory={onSaveHistory}
        />
        {showFilter && hasConfig && onFiltersChange && (
          <div className="search-filter-wrapper" ref={filterPanelRef}>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`search-filter-button ${hasActiveFilters ? 'active' : ''}`}
              title={translate('search.header.filter') || '筛选'}
            >
              <Filter size={18} />
              {hasActiveFilters && <span className="search-filter-badge" />}
            </button>
            {showFilterPanel && (
              <div className="search-filter-panel">
                <div className="search-filter-panel-header">
                  <span className="search-filter-panel-title">
                    {translate('search.header.filter') || '筛选'}
                  </span>
                  {hasActiveFilters && (
                    <button
                      onClick={handleClearAll}
                      className="search-filter-clear"
                    >
                      {translate('search.header.clearFilters') || '清除'}
                    </button>
                  )}
                </div>
                {availableTypes.length > 0 && (
                  <div className="search-filter-section">
                    <label className="search-filter-label">
                      {translate('image.filter.imageType') || '图片类型'}
                    </label>
                    <div className="search-filter-options">
                      {availableTypes.map(type => (
                        <label key={type} className="search-filter-option">
                          <input
                            type="checkbox"
                            checked={
                              externalFilters?.selectedTypes.includes(type) ||
                              false
                            }
                            onChange={e =>
                              handleTypeChange(type, e.target.checked)
                            }
                          />
                          <span>{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {availableTags.length > 0 && (
                  <div className="search-filter-section">
                    <label className="search-filter-label">
                      {translate('image.filter.tags') || '标签'}
                    </label>
                    <div className="search-filter-options">
                      {availableTags.map(tag => (
                        <label key={tag} className="search-filter-option">
                          <input
                            type="checkbox"
                            checked={
                              externalFilters?.selectedTags.includes(tag) ||
                              false
                            }
                            onChange={e =>
                              handleTagChange(tag, e.target.checked)
                            }
                          />
                          <span>{tag}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Image variant：搜索框 + 标签筛选（内联显示）
  if (variant === 'image') {
    const displayTags = allTags.length > 0 ? allTags : availableTags;
    return (
      <div className={`search-wrapper search-wrapper--image ${className}`}>
        {/* 搜索框 */}
        <div className="search-input-container">
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder={getPlaceholder()}
            disabled={disabled}
            showHistory={showHistory}
            history={history}
            onSelectHistory={onSelectHistory}
            onDeleteHistory={onDeleteHistory}
            onClearHistory={onClearHistory}
            onSaveHistory={onSaveHistory}
          />
        </div>

        {/* 标签过滤 */}
        {displayTags.length > 0 && onTagsChange && (
          <div className="search-tags-container">
            <div className="search-tags-label">
              <Filter className="search-tags-icon" />
              <span className="search-tags-text">
                {translate('search.image.filterByTags')}:
              </span>
            </div>
            <div className="search-tags">
              {selectedTags.length > 0 && (
                <button
                  onClick={handleClearTags}
                  className="search-tags-clear-button"
                >
                  {translate('search.image.clearFilters')} (
                  {selectedTags.length})
                </button>
              )}
              {displayTags.map((tag, index) => (
                <button
                  key={`search-tag-${index}`}
                  onClick={() => handleTagToggle(tag)}
                  className={`search-tag-button ${
                    selectedTags.includes(tag) ? 'selected' : 'unselected'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default Search;
