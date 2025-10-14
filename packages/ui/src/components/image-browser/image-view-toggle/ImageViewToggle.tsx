import React from 'react'
import { Grid, List } from 'lucide-react'
import { defaultTranslate } from '../../../locales/defaultTranslate'

export type ViewMode = 'grid' | 'list'

interface ViewToggleProps {
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
  className?: string
  t?: (key: string) => string
}

const ViewToggle: React.FC<ViewToggleProps> = ({ 
  currentView, 
  onViewChange, 
  className = '',
  t
}) => {
  // 使用传入的翻译函数或默认中文翻译函数
  const translate = t || defaultTranslate
  return (
    <div className={`flex items-center bg-white border border-gray-200 rounded-lg p-1 ${className}`}>
      <button
        onClick={() => onViewChange('grid')}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 ${
          currentView === 'grid'
            ? 'bg-blue-100 text-blue-700 border border-blue-200'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
        title={translate('image.viewMode.grid')}
      >
        <Grid className="w-4 h-4" />
        <span className="text-sm font-medium">{translate('image.viewMode.grid')}</span>
      </button>
      
      <button
        onClick={() => onViewChange('list')}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 ${
          currentView === 'list'
            ? 'bg-blue-100 text-blue-700 border border-blue-200'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
        title={translate('image.viewMode.list')}
      >
        <List className="w-4 h-4" />
        <span className="text-sm font-medium">{translate('image.viewMode.list')}</span>
      </button>
    </div>
  )
}

export default ViewToggle 