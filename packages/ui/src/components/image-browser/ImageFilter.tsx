import React, { useState, useCallback, useMemo } from 'react'
import { Search, Filter, X, Image as ImageIcon, HardDrive } from 'lucide-react'
import { ImageItem } from '../../types/image'
import { formatFileSize } from '../../utils/fileSizeUtils'
import { defaultTranslate } from '../../locales/defaultTranslate'
import './ImageFilter.css'

export interface FilterOptions {
  searchTerm: string
  selectedTypes: string[]
  selectedTags: string[]
  sizeRange: {
    min: number
    max: number
  }
}

interface ImageFilterProps {
  images: ImageItem[]
  currentFilters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  className?: string
  t?: (key: string) => string
}

const ImageFilter: React.FC<ImageFilterProps> = ({ 
  images, 
  currentFilters, 
  onFiltersChange, 
  className = '',
  t
}) => {
  // 使用传入的翻译函数或默认中文翻译函数
  const translate = t || defaultTranslate
  const [isExpanded, setIsExpanded] = useState(false)

  // 获取所有可用的图片类型
  const availableTypes = useMemo(() => {
    const types = new Set<string>()
    images.forEach(image => {
      if (image.type) {
        types.add(image.type)
      }
    })
    return Array.from(types).sort()
  }, [images])

  // 获取所有可用的标签
  const availableTags = useMemo(() => {
    const tags = new Set<string>()
    images.forEach(image => {
      if (image.tags && image.tags.length > 0) {
        image.tags.forEach(tag => tags.add(tag))
      }
    })
    return Array.from(tags).sort()
  }, [images])

  // 获取文件大小范围
  const fileSizeRange = useMemo(() => {
    if (images.length === 0) return { min: 0, max: 0 }
    
    const sizes = images.map(img => img.size).filter(size => size > 0)
    if (sizes.length === 0) return { min: 0, max: 0 }
    
    return {
      min: Math.min(...sizes),
      max: Math.max(...sizes)
    }
  }, [images])

  // 处理搜索词变化
  const handleSearchChange = useCallback((searchTerm: string) => {
    onFiltersChange({
      ...currentFilters,
      searchTerm
    })
  }, [currentFilters, onFiltersChange])

  // 处理类型筛选变化
  const handleTypeChange = useCallback((type: string, isSelected: boolean) => {
    const newSelectedTypes = isSelected
      ? [...currentFilters.selectedTypes, type]
      : currentFilters.selectedTypes.filter(t => t !== type)
    
    onFiltersChange({
      ...currentFilters,
      selectedTypes: newSelectedTypes
    })
  }, [currentFilters, onFiltersChange])

  // 处理标签筛选变化
  const handleTagChange = useCallback((tag: string, isSelected: boolean) => {
    const newSelectedTags = isSelected
      ? [...currentFilters.selectedTags, tag]
      : currentFilters.selectedTags.filter(t => t !== tag)
    
    onFiltersChange({
      ...currentFilters,
      selectedTags: newSelectedTags
    })
  }, [currentFilters, onFiltersChange])

  // 处理文件大小范围变化
  const handleSizeRangeChange = useCallback((min: number, max: number) => {
    onFiltersChange({
      ...currentFilters,
      sizeRange: { min, max }
    })
  }, [currentFilters, onFiltersChange])

  // 清除所有筛选条件
  const handleClearAll = useCallback(() => {
    onFiltersChange({
      searchTerm: '',
      selectedTypes: [],
      selectedTags: [],
      sizeRange: { min: 0, max: 0 }
    })
  }, [onFiltersChange])

  // 获取筛选统计信息
  const filterStats = useMemo(() => {
    const { searchTerm, selectedTypes, selectedTags, sizeRange } = currentFilters
    const hasFilters = searchTerm || selectedTypes.length > 0 || selectedTags.length > 0 || (sizeRange.min > 0 || sizeRange.max > 0)
    
    let count = images.length
    if (hasFilters) {
      count = images.filter(image => {
        // 搜索词筛选
        if (searchTerm) {
          const matchesSearch = image.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               image.description?.toLowerCase().includes(searchTerm.toLowerCase())
          if (!matchesSearch) return false
        }
        
        // 类型筛选
        if (selectedTypes.length > 0) {
          if (!image.type || !selectedTypes.includes(image.type)) return false
        }
        
        // 标签筛选
        if (selectedTags.length > 0) {
          if (!image.tags || !selectedTags.some(tag => image.tags.includes(tag))) return false
        }
        
        // 文件大小筛选
        if (sizeRange.min > 0 && image.size < sizeRange.min) {
          return false
        }
        if (sizeRange.max > 0 && image.size > sizeRange.max) {
          return false
        }
        
        return true
      }).length
    }
    
    return { total: images.length, filtered: count, hasFilters }
  }, [images, currentFilters])

  // 获取文件类型显示名称
  const getTypeDisplayName = (type: string): string => {
    const typeMap: Record<string, string> = {
      'image/jpeg': 'JPEG',
      'image/jpg': 'JPG',
      'image/png': 'PNG',
      'image/gif': 'GIF',
      'image/bmp': 'BMP',
      'image/webp': 'WebP',
      'image/svg+xml': 'SVG',
      'image/tiff': 'TIFF'
    }
    return typeMap[type] || type.split('/')[1]?.toUpperCase() || type
  }

  return (
    <div className={`image-filter-container ${className}`}>
      {/* 筛选头部 */}
      <div className="image-filter-header">
        <div className="image-filter-title">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">{translate('image.filter.title')}</h3>
          {filterStats.hasFilters && (
            <span className="image-filter-stats">
              {filterStats.filtered}/{filterStats.total}
            </span>
          )}
        </div>
        
        <div className="image-filter-actions">
          {filterStats.hasFilters && (
            <button
              onClick={handleClearAll}
              className="image-filter-clear"
            >
              清除筛选
            </button>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="image-filter-toggle"
            title={isExpanded ? translate('image.filter.collapse') : translate('image.filter.expand')}
          >
            {isExpanded ? (
              <X className="w-4 h-4" />
            ) : (
              <Filter className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* 筛选内容 */}
      {isExpanded && (
        <div className="image-filter-content">
          {/* 搜索筛选 */}
          <div className="image-filter-section">
            <label className="image-filter-label">
              搜索图片
            </label>
            <div className="image-filter-search">
              <Search className="image-filter-search-icon" />
              <input
                type="text"
                placeholder={translate('image.filter.searchPlaceholder')}
                value={currentFilters.searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="image-filter-input"
              />
            </div>
          </div>

          {/* 类型筛选 */}
          {availableTypes.length > 0 && (
            <div className="image-filter-section">
              <label className="image-filter-label">
                {translate('image.filter.imageType')}
              </label>
              <div className="image-filter-types">
                {availableTypes.map((type, index) => (
                  <label
                    key={`filter-type-${index}`}
                    className="image-filter-type-item"
                  >
                    <input
                      type="checkbox"
                      checked={currentFilters.selectedTypes.includes(type)}
                      onChange={(e) => handleTypeChange(type, e.target.checked)}
                      className="image-filter-type-checkbox"
                    />
                    <ImageIcon className="image-filter-type-icon" />
                    <span className="image-filter-type-label">
                      {getTypeDisplayName(type)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 标签筛选 */}
          {availableTags.length > 0 && (
            <div className="image-filter-section">
              <label className="image-filter-label">
                {translate('image.filter.tags')}
              </label>
              <div className="image-filter-tags">
                {availableTags.map((tag, index) => (
                  <label
                    key={`filter-tag-${index}`}
                    className="image-filter-tag-item"
                  >
                    <input
                      type="checkbox"
                      checked={currentFilters.selectedTags.includes(tag)}
                      onChange={(e) => handleTagChange(tag, e.target.checked)}
                      className="image-filter-tag-checkbox"
                    />
                    <span className="image-filter-tag-label">{tag}</span>
                  </label>
                  ))}
              </div>
            </div>
          )}

          {/* 文件大小筛选 */}
          {fileSizeRange.max > 0 && (
            <div className="image-filter-section">
              <label className="image-filter-label">
                <HardDrive className="w-4 h-4 mr-2" />
                文件大小范围
              </label>
              <div className="image-filter-size-range">
                <div className="image-filter-size-inputs">
                  <div className="image-filter-size-input">
                    <label className="image-filter-size-label">最小</label>
                    <input
                      type="number"
                      min="0"
                      max={fileSizeRange.max}
                      step="1024"
                      placeholder="最小大小 (字节)"
                      value={currentFilters.sizeRange.min || ''}
                      onChange={(e) => {
                        const min = parseInt(e.target.value) || 0
                        handleSizeRangeChange(min, currentFilters.sizeRange.max)
                      }}
                      className="image-filter-size-number"
                    />
                    <span className="image-filter-size-unit">
                      {currentFilters.sizeRange.min > 0 ? formatFileSize(currentFilters.sizeRange.min) : ''}
                    </span>
                  </div>
                  <div className="image-filter-size-input">
                    <label className="image-filter-size-label">最大</label>
                    <input
                      type="number"
                      min="1024"
                      max={fileSizeRange.max}
                      step="1024"
                      placeholder="最大大小 (字节)"
                      value={currentFilters.sizeRange.max || ''}
                      onChange={(e) => {
                        const max = parseInt(e.target.value) || 0
                        handleSizeRangeChange(currentFilters.sizeRange.min, max)
                      }}
                      className="image-filter-size-number"
                    />
                    <span className="image-filter-size-unit">
                      {currentFilters.sizeRange.max > 0 ? formatFileSize(currentFilters.sizeRange.max) : ''}
                    </span>
                  </div>
                </div>
                <div className="image-filter-size-info">
                  <span className="text-xs text-gray-500">
                    当前范围: {formatFileSize(fileSizeRange.min)} - {formatFileSize(fileSizeRange.max)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 筛选结果统计 */}
          <div className="image-filter-footer">
            <span>
              显示 {filterStats.filtered} 张图片
              {filterStats.hasFilters && ` (共 ${filterStats.total} 张)`}
            </span>
            {filterStats.hasFilters && (
              <button
                onClick={handleClearAll}
                className="image-filter-reset"
              >
                重置筛选
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageFilter 