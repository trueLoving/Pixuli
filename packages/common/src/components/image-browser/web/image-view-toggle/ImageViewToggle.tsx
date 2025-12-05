import { Grid, List } from 'lucide-react';
import React from 'react';
import { defaultTranslate } from '../../../../locales';
import './ImageViewToggle.css';

export type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
  t?: (key: string) => string;
}

const ViewToggle: React.FC<ViewToggleProps> = ({
  currentView,
  onViewChange,
  className = '',
  t,
}) => {
  // 使用传入的翻译函数或默认中文翻译函数
  const translate = t || defaultTranslate;
  return (
    <div className={`image-view-toggle-container ${className}`}>
      <button
        onClick={() => onViewChange('grid')}
        className={`image-view-toggle-button ${
          currentView === 'grid' ? 'active' : 'inactive'
        }`}
        title={translate('image.viewMode.grid')}
      >
        <Grid className="image-view-toggle-icon" />
        <span className="image-view-toggle-text">
          {translate('image.viewMode.grid')}
        </span>
      </button>

      <button
        onClick={() => onViewChange('list')}
        className={`image-view-toggle-button ${
          currentView === 'list' ? 'active' : 'inactive'
        }`}
        title={translate('image.viewMode.list')}
      >
        <List className="image-view-toggle-icon" />
        <span className="image-view-toggle-text">
          {translate('image.viewMode.list')}
        </span>
      </button>
    </div>
  );
};

export default ViewToggle;
