import { Filter, RefreshCw } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { defaultTranslate } from '../../locales';
import type { ImageItem } from '../../types/image';
import type { FilterOptions } from '../image-browser/image-filter/ImageFilter';
import {
  default as LanguageSwitcher,
  type Language,
} from '../language-switcher/LanguageSwitcher';
import { SearchBar } from '../search';
import './Header.css';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  hasConfig: boolean;
  onRefresh?: () => void;
  loading?: boolean;
  onSettings?: () => void;
  currentLanguage?: string;
  availableLanguages?: Language[];
  onLanguageChange?: (language: string) => void;
  t?: (key: string) => string;
  /** 图片列表（用于筛选功能，可选） */
  images?: ImageItem[];
  /** 外部筛选条件（用于与Header筛选同步，可选） */
  externalFilters?: FilterOptions;
  /** 筛选条件变化回调（可选） */
  onFiltersChange?: (
    filters: FilterOptions | ((prev: FilterOptions) => FilterOptions),
  ) => void;
  /** 是否显示筛选功能（默认false，web端传true） */
  showFilter?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  hasConfig,
  onRefresh,
  loading = false,
  currentLanguage,
  availableLanguages,
  onLanguageChange,
  t,
  images = [],
  externalFilters,
  onFiltersChange,
  showFilter = false,
}) => {
  const translate = t || defaultTranslate;
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const filterPanelRef = React.useRef<HTMLDivElement>(null);

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

  // 点击外部关闭筛选面板
  React.useEffect(() => {
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

  return (
    <header className="app-header">
      <div className="header-left">
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={
            hasConfig
              ? translate('header.search.placeholder')
              : translate('header.search.placeholderDisabled')
          }
          disabled={!hasConfig}
        />
        {showFilter && hasConfig && onFiltersChange && (
          <div className="header-filter-wrapper" ref={filterPanelRef}>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`header-filter-button ${hasActiveFilters ? 'active' : ''}`}
              title={translate('header.filter') || '筛选'}
            >
              <Filter size={18} />
              {hasActiveFilters && <span className="header-filter-badge" />}
            </button>
            {showFilterPanel && (
              <div className="header-filter-panel">
                <div className="header-filter-panel-header">
                  <span className="header-filter-panel-title">
                    {translate('header.filter') || '筛选'}
                  </span>
                  {hasActiveFilters && (
                    <button
                      onClick={handleClearAll}
                      className="header-filter-clear"
                    >
                      {translate('header.clearFilters') || '清除'}
                    </button>
                  )}
                </div>
                {availableTypes.length > 0 && (
                  <div className="header-filter-section">
                    <label className="header-filter-label">
                      {translate('image.filter.imageType') || '图片类型'}
                    </label>
                    <div className="header-filter-options">
                      {availableTypes.map(type => (
                        <label key={type} className="header-filter-option">
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
                  <div className="header-filter-section">
                    <label className="header-filter-label">
                      {translate('image.filter.tags') || '标签'}
                    </label>
                    <div className="header-filter-options">
                      {availableTags.map(tag => (
                        <label key={tag} className="header-filter-option">
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

      <div className="header-right">
        {hasConfig && onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="header-button icon-only"
            title={`${translate('navigation.refresh')} (F5)`}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        )}

        {currentLanguage && availableLanguages && onLanguageChange && (
          <LanguageSwitcher
            currentLanguage={currentLanguage}
            availableLanguages={availableLanguages}
            onLanguageChange={onLanguageChange}
            switchTitle={translate('language.switch')}
            currentTitle={translate('language.current')}
            showBackdrop={true}
          />
        )}
      </div>
    </header>
  );
};

export default Header;
