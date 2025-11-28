import {
  Compass,
  Github,
  Heart,
  HelpCircle,
  Image as ImageIcon,
  Lock,
  Plus,
  Tag,
} from 'lucide-react';
import React, { useState } from 'react';
import { defaultTranslate } from '../../locales';
import './Sidebar.css';

export type SidebarView =
  | 'photos'
  | 'explore'
  | 'tags'
  | 'favorites'
  | 'settings';

export interface SidebarSource {
  id: string;
  name: string;
  type: 'github' | 'gitee';
  owner: string;
  repo: string;
  path: string;
  active?: boolean;
}

interface SidebarProps {
  currentView: SidebarView;
  onViewChange: (view: SidebarView) => void;
  sources: SidebarSource[];
  selectedSourceId: string | null;
  onSourceSelect: (id: string) => void;
  hasConfig: boolean;
  onAddSource: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  t?: (key: string) => string;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  tooltip?: string;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  active,
  disabled,
  onClick,
  tooltip,
}) => {
  return (
    <button
      className={`sidebar-nav-item ${active ? 'active' : ''} ${
        disabled ? 'disabled' : ''
      }`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={tooltip}
    >
      <span className="sidebar-nav-icon">{icon}</span>
      <span className="sidebar-nav-label">{label}</span>
      {disabled && (
        <span className="sidebar-nav-badge" title={tooltip}>
          <Lock size={12} />
        </span>
      )}
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  sources,
  selectedSourceId,
  onSourceSelect,
  hasConfig,
  onAddSource,
  collapsed = false,
  onToggleCollapse,
  t,
}) => {
  const translate = t || defaultTranslate;
  const [sourcesExpanded, setSourcesExpanded] = useState(true);

  if (collapsed) {
    return (
      <aside className="sidebar collapsed">
        {/* Logo 图标 */}
        <div className="sidebar-collapsed-header">
          <button
            onClick={onToggleCollapse}
            className="sidebar-collapsed-logo-btn"
            title={translate('sidebar.expand')}
          >
            <img
              src="/icon-192x192.png"
              alt="Pixuli"
              className="sidebar-collapsed-logo"
            />
          </button>
        </div>

        {/* 主要导航 - 折叠状态 */}
        <nav className="sidebar-collapsed-nav">
          <button
            className={`sidebar-collapsed-item ${
              currentView === 'photos' ? 'active' : ''
            } ${!hasConfig ? 'disabled' : ''}`}
            onClick={hasConfig ? () => onViewChange('photos') : undefined}
            disabled={!hasConfig}
            title={translate('sidebar.photos')}
          >
            <ImageIcon size={28} />
            <span className="sidebar-collapsed-tooltip">
              {translate('sidebar.photos')}
            </span>
          </button>
          <button
            className={`sidebar-collapsed-item ${
              currentView === 'explore' ? 'active' : ''
            } ${!hasConfig ? 'disabled' : ''}`}
            onClick={hasConfig ? () => onViewChange('explore') : undefined}
            disabled={!hasConfig}
            title={translate('sidebar.explore')}
          >
            <Compass size={28} />
            <span className="sidebar-collapsed-tooltip">
              {translate('sidebar.explore')}
            </span>
          </button>
          <button
            className={`sidebar-collapsed-item ${
              currentView === 'tags' ? 'active' : ''
            } ${!hasConfig ? 'disabled' : ''}`}
            onClick={hasConfig ? () => onViewChange('tags') : undefined}
            disabled={!hasConfig}
            title={translate('sidebar.tags')}
          >
            <Tag size={28} />
            <span className="sidebar-collapsed-tooltip">
              {translate('sidebar.tags')}
            </span>
          </button>
          <button
            className={`sidebar-collapsed-item ${
              currentView === 'favorites' ? 'active' : ''
            } ${!hasConfig ? 'disabled' : ''}`}
            onClick={hasConfig ? () => onViewChange('favorites') : undefined}
            disabled={!hasConfig}
            title={translate('sidebar.favorites')}
          >
            <Heart size={28} />
            <span className="sidebar-collapsed-tooltip">
              {translate('sidebar.favorites')}
            </span>
          </button>
        </nav>

        {/* 仓库源 - 折叠状态 */}
        {sources.length > 0 && (
          <div className="sidebar-collapsed-sources">
            {sources.slice(0, 3).map(source => (
              <button
                key={source.id}
                className={`sidebar-collapsed-source-item ${
                  selectedSourceId === source.id ? 'active' : ''
                }`}
                onClick={() => onSourceSelect(source.id)}
                title={`${source.name}\n${source.owner}/${source.repo}`}
              >
                {source.type === 'github' ? (
                  <Github size={26} />
                ) : (
                  <div className="gitee-icon-small">码</div>
                )}
                <span className="sidebar-collapsed-tooltip">{source.name}</span>
              </button>
            ))}
            {sources.length > 3 && (
              <div
                className="sidebar-collapsed-more"
                title={`还有 ${sources.length - 3} 个源`}
              >
                <Plus size={16} />
                <span className="sidebar-collapsed-tooltip">
                  {translate('sidebar.sources')} (+{sources.length - 3})
                </span>
              </div>
            )}
          </div>
        )}

        {/* 添加源按钮 - 折叠状态 */}
        <div className="sidebar-collapsed-add">
          <button
            onClick={onAddSource}
            className="sidebar-collapsed-add-btn"
            title={translate('sidebar.addSource')}
          >
            <Plus size={28} />
            <span className="sidebar-collapsed-tooltip">
              {translate('sidebar.addSource')}
            </span>
          </button>
        </div>

        {/* 底部操作 - 折叠状态 */}
        <div className="sidebar-collapsed-footer">
          <button
            className="sidebar-collapsed-item"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('openKeyboardHelp'));
            }}
            title={translate('sidebar.help')}
          >
            <HelpCircle size={28} />
            <span className="sidebar-collapsed-tooltip">
              {translate('sidebar.help')}
            </span>
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      {/* Logo/Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo-container">
          <img
            src="/icon-192x192.png"
            alt="Pixuli"
            className="sidebar-logo-icon"
          />
          <span className="sidebar-logo-text">Pixuli</span>
        </div>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="sidebar-collapse-btn"
            title={translate('sidebar.collapse')}
          >
            ←
          </button>
        )}
      </div>

      {/* 主要导航 */}
      <nav className="sidebar-nav">
        <NavItem
          icon={<ImageIcon size={20} />}
          label={translate('sidebar.photos')}
          active={currentView === 'photos'}
          disabled={!hasConfig}
          onClick={() => onViewChange('photos')}
          tooltip={!hasConfig ? translate('sidebar.needSource') : undefined}
        />
        <NavItem
          icon={<Compass size={20} />}
          label={translate('sidebar.explore')}
          active={currentView === 'explore'}
          disabled={!hasConfig}
          onClick={() => onViewChange('explore')}
          tooltip={!hasConfig ? translate('sidebar.needSource') : undefined}
        />
        <NavItem
          icon={<Tag size={20} />}
          label={translate('sidebar.tags')}
          active={currentView === 'tags'}
          disabled={!hasConfig}
          onClick={() => onViewChange('tags')}
          tooltip={!hasConfig ? translate('sidebar.needSource') : undefined}
        />
        <NavItem
          icon={<Heart size={20} />}
          label={translate('sidebar.favorites')}
          active={currentView === 'favorites'}
          disabled={!hasConfig}
          onClick={() => onViewChange('favorites')}
          tooltip={!hasConfig ? translate('sidebar.needSource') : undefined}
        />
      </nav>

      {/* 仓库源列表 */}
      <div className="sidebar-sources">
        <div className="sidebar-section-header">
          <span className="sidebar-section-title">
            {translate('sidebar.sources')}
          </span>
          <button
            onClick={onAddSource}
            className="sidebar-add-source-btn"
            title={translate('sidebar.addSource')}
          >
            <Plus size={16} />
          </button>
        </div>

        {sources.length === 0 ? (
          <div className="sidebar-empty-state">
            <div className="sidebar-empty-icon">
              <Plus size={24} className="text-gray-400" />
            </div>
            <p className="sidebar-empty-text">
              {translate('sidebar.emptyState.text')}
            </p>
            <button onClick={onAddSource} className="sidebar-add-button">
              <Plus size={16} />
              {translate('sidebar.emptyState.addSource')}
            </button>
          </div>
        ) : (
          <div className="sidebar-source-list">
            {sources.map(source => (
              <button
                key={source.id}
                className={`sidebar-source-item ${
                  selectedSourceId === source.id ? 'active' : ''
                }`}
                onClick={() => onSourceSelect(source.id)}
                title={`${source.owner}/${source.repo}`}
              >
                <div className="sidebar-source-icon">
                  {source.type === 'github' ? (
                    <Github size={16} />
                  ) : (
                    <div className="gitee-icon">码</div>
                  )}
                </div>
                <div className="sidebar-source-info">
                  <div className="sidebar-source-name">{source.name}</div>
                  <div className="sidebar-source-path">
                    {source.owner}/{source.repo}
                  </div>
                </div>
                {source.active && <div className="sidebar-source-active-dot" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 底部操作 */}
      <div className="sidebar-footer">
        <NavItem
          icon={<HelpCircle size={20} />}
          label={translate('sidebar.help')}
          onClick={() => {
            // 触发帮助事件
            window.dispatchEvent(new CustomEvent('openKeyboardHelp'));
          }}
        />
      </div>
    </aside>
  );
};

export default Sidebar;
