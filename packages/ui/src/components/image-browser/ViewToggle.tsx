import React from 'react'
import { Grid, List } from 'lucide-react'

export type ViewMode = 'grid' | 'list'

interface ViewToggleProps {
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
  className?: string
}

const ViewToggle: React.FC<ViewToggleProps> = ({ 
  currentView, 
  onViewChange, 
  className = '' 
}) => {
  return (
    <div className={`flex items-center bg-white border border-gray-200 rounded-lg p-1 ${className}`}>
      <button
        onClick={() => onViewChange('grid')}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 ${
          currentView === 'grid'
            ? 'bg-blue-100 text-blue-700 border border-blue-200'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
        title="网格视图"
      >
        <Grid className="w-4 h-4" />
        <span className="text-sm font-medium">网格</span>
      </button>
      
      <button
        onClick={() => onViewChange('list')}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 ${
          currentView === 'list'
            ? 'bg-blue-100 text-blue-700 border border-blue-200'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
        title="列表视图"
      >
        <List className="w-4 h-4" />
        <span className="text-sm font-medium">列表</span>
      </button>
    </div>
  )
}

export default ViewToggle