import React from 'react'
import { Search, Filter } from 'lucide-react'
import { defaultTranslate } from '../../locales/defaultTranslate'

export interface ImageSearchProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  allTags: string[]
  t?: (key: string) => string
  className?: string
}

const ImageSearch: React.FC<ImageSearchProps> = ({
  searchTerm,
  onSearchChange,
  selectedTags,
  onTagsChange,
  allTags,
  t,
  className = ''
}) => {
  // 使用传入的翻译函数或默认中文翻译函数
  const translate = t || defaultTranslate

  const handleTagToggle = (tag: string) => {
    onTagsChange(
      selectedTags.includes(tag)
        ? selectedTags.filter(t => t !== tag)
        : [...selectedTags, tag]
    )
  }

  const handleClearFilters = () => {
    onTagsChange([])
  }

  return (
    <div className={`mb-4 space-y-3 ${className}`}>
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={translate('image.search.placeholder')}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
        />
      </div>

      {/* 标签过滤 */}
      {allTags.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{translate('image.search.filterByTags')}:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTags.length > 0 && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
              >
                {translate('image.search.clearFilters')} ({selectedTags.length})
              </button>
            )}
            {allTags.map((tag, index) => (
              <button
                key={`search-tag-${index}`}
                onClick={() => handleTagToggle(tag)}
                className={`px-3 py-1 text-xs rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageSearch
