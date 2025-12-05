import { Filter, Search } from 'lucide-react';
import React from 'react';
import { defaultTranslate } from '../../../locales';
import './ImageSearch.css';

export interface ImageSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  allTags: string[];
  t?: (key: string) => string;
  className?: string;
}

const ImageSearch: React.FC<ImageSearchProps> = ({
  searchTerm,
  onSearchChange,
  selectedTags,
  onTagsChange,
  allTags,
  t,
  className = '',
}) => {
  // 使用传入的翻译函数或默认中文翻译函数
  const translate = t || defaultTranslate;

  const handleTagToggle = (tag: string) => {
    onTagsChange(
      selectedTags.includes(tag)
        ? selectedTags.filter(t => t !== tag)
        : [...selectedTags, tag],
    );
  };

  const handleClearFilters = () => {
    onTagsChange([]);
  };

  return (
    <div className={`image-search-container ${className}`}>
      {/* 搜索框 */}
      <div className="image-search-input-container">
        <Search className="image-search-icon" />
        <input
          type="text"
          placeholder={translate('image.search.placeholder')}
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          className="image-search-input"
        />
      </div>

      {/* 标签过滤 */}
      {allTags.length > 0 && (
        <div className="image-search-filters">
          <div className="image-search-filter-label">
            <Filter className="image-search-filter-icon" />
            <span className="image-search-filter-text">
              {translate('image.search.filterByTags')}:
            </span>
          </div>
          <div className="image-search-tags">
            {selectedTags.length > 0 && (
              <button
                onClick={handleClearFilters}
                className="image-search-clear-button"
              >
                {translate('image.search.clearFilters')} ({selectedTags.length})
              </button>
            )}
            {allTags.map((tag, index) => (
              <button
                key={`search-tag-${index}`}
                onClick={() => handleTagToggle(tag)}
                className={`image-search-tag-button ${
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
};

export default ImageSearch;
