import {
  ExternalLink,
  Github,
  Heart,
  HelpCircle,
  Image as ImageIcon,
  Info,
  Keyboard,
  LayoutGrid,
  Lock,
  Play,
  Plus,
  Tag,
  FileText,
  Edit,
  Trash2,
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { defaultTranslate } from '../../locales';
import type { BrowseMode } from '../browse-mode-switcher';
import './Sidebar.css';

export type SidebarView =
  | 'photos'
  | 'explore'
  | 'tags'
  | 'favorites'
  | 'settings';

export type SidebarFilter = 'all' | 'tags' | 'favorites';

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
  currentView?: SidebarView;
  onViewChange?: (view: SidebarView) => void;
  // 浏览模式相关
  browseMode?: BrowseMode;
  onBrowseModeChange?: (mode: BrowseMode) => void;
  // 筛选相关
  currentFilter?: SidebarFilter;
  onFilterChange?: (filter: SidebarFilter) => void;
  sources: SidebarSource[];
  selectedSourceId: string | null;
  onSourceSelect: (id: string) => void;
  onSourceEdit?: (id: string) => void;
  onSourceDelete?: (id: string) => void;
  onSourceOpenInWindow?: (id: string) => void;
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
  comingSoon?: boolean;
  onClick?: () => void;
  tooltip?: string;
  t?: (key: string) => string;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  active,
  disabled,
  comingSoon,
  onClick,
  tooltip,
  t,
}) => {
  const translate = t || defaultTranslate;
  const finalTooltip = comingSoon
    ? translate('sidebar.comingSoon')
    : tooltip || (disabled ? translate('sidebar.disabled') : undefined);

  return (
    <button
      className={`sidebar-nav-item ${active ? 'active' : ''} ${
        disabled ? 'disabled' : ''
      } ${comingSoon ? 'coming-soon' : ''}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={finalTooltip}
    >
      <span className="sidebar-nav-icon">{icon}</span>
      <span className="sidebar-nav-label">{label}</span>
      {comingSoon && (
        <span
          className="sidebar-nav-badge coming-soon-badge"
          title={finalTooltip}
        >
          <Lock size={12} />
        </span>
      )}
      {disabled && !comingSoon && (
        <span className="sidebar-nav-badge" title={finalTooltip}>
          <Lock size={12} />
        </span>
      )}
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  browseMode = 'file',
  onBrowseModeChange,
  currentFilter = 'all',
  onFilterChange,
  sources,
  selectedSourceId,
  onSourceSelect,
  onSourceEdit,
  onSourceDelete,
  onSourceOpenInWindow,
  hasConfig,
  onAddSource,
  collapsed = false,
  onToggleCollapse,
  t,
}) => {
  const translate = t || defaultTranslate;
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    sourceId: string;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  // 性能优化：动画开始前设置 will-change，动画结束后移除
  useEffect(() => {
    if (!sidebarRef.current) return;

    const sidebar = sidebarRef.current;

    // 动画开始前：设置 will-change 启用 GPU 加速
    sidebar.style.willChange = 'width, max-width, min-width';

    const handleTransitionEnd = (e: TransitionEvent) => {
      // 只处理 width 相关的过渡结束
      if (
        e.propertyName === 'width' ||
        e.propertyName === 'min-width' ||
        e.propertyName === 'max-width'
      ) {
        // 动画结束后移除 will-change，减少内存占用
        sidebar.style.willChange = 'auto';
      }
    };

    sidebar.addEventListener('transitionend', handleTransitionEnd);

    return () => {
      sidebar.removeEventListener('transitionend', handleTransitionEnd);
      // 清理时也移除 will-change
      sidebar.style.willChange = 'auto';
    };
  }, [collapsed]);

  // 浏览模式配置
  const browseModes: Array<{
    mode: BrowseMode;
    icon: React.ReactNode;
    label: string;
    disabled?: boolean;
    comingSoon?: boolean;
  }> = [
    {
      mode: 'file',
      icon: <FileText size={20} />,
      label: translate('browseMode.file'),
    },
    {
      mode: 'slide',
      icon: <Play size={20} />,
      label: translate('browseMode.slide'),
      disabled: true,
      comingSoon: true,
    },
    {
      mode: 'wall',
      icon: <LayoutGrid size={20} />,
      label: translate('browseMode.wall'),
      disabled: true,
      comingSoon: true,
    },
    {
      mode: 'gallery3d',
      icon: <ImageIcon size={20} />,
      label: translate('browseMode.gallery3d'),
      disabled: true,
      comingSoon: true,
    },
  ];

  // 筛选选项配置
  const filters: Array<{
    filter: SidebarFilter;
    icon: React.ReactNode;
    label: string;
    disabled?: boolean;
    comingSoon?: boolean;
  }> = [
    {
      filter: 'all',
      icon: <ImageIcon size={20} />,
      label: translate('sidebar.all'),
    },
    {
      filter: 'tags',
      icon: <Tag size={20} />,
      label: translate('sidebar.tags'),
      disabled: true,
      comingSoon: true,
    },
    {
      filter: 'favorites',
      icon: <Heart size={20} />,
      label: translate('sidebar.favorites'),
      disabled: true,
      comingSoon: true,
    },
  ];

  // 处理右键菜单
  const handleContextMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    sourceId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      sourceId,
    });
  };

  // 关闭右键菜单
  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // 处理编辑
  const handleEdit = (sourceId: string) => {
    if (onSourceEdit) {
      onSourceEdit(sourceId);
    }
    closeContextMenu();
  };

  // 处理删除
  const handleDelete = (sourceId: string) => {
    if (onSourceDelete) {
      onSourceDelete(sourceId);
    }
    closeContextMenu();
  };

  // 处理在单独窗口打开
  const handleOpenInWindow = (sourceId: string) => {
    if (onSourceOpenInWindow) {
      onSourceOpenInWindow(sourceId);
    }
    closeContextMenu();
  };

  // 点击外部关闭右键菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target as Node)
      ) {
        closeContextMenu();
      }
    };

    if (contextMenu?.visible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [contextMenu?.visible]);

  // 渲染右键菜单（使用 Portal 避免被遮挡）
  const renderContextMenu = () => {
    if (!contextMenu?.visible) return null;

    const menuContent = (
      <div
        ref={contextMenuRef}
        className="sidebar-context-menu"
        style={{
          position: 'fixed',
          left: contextMenu.x,
          top: contextMenu.y,
          zIndex: 999999,
        }}
      >
        {onSourceOpenInWindow && (
          <button
            className="sidebar-context-menu-item"
            onClick={() => handleOpenInWindow(contextMenu.sourceId)}
          >
            <ExternalLink size={16} />
            <span>{translate('sidebar.openInWindow')}</span>
          </button>
        )}
        <button
          className="sidebar-context-menu-item"
          onClick={() => handleEdit(contextMenu.sourceId)}
        >
          <Edit size={16} />
          <span>{translate('sidebar.editSource')}</span>
        </button>
        <button
          className="sidebar-context-menu-item sidebar-context-menu-item-danger"
          onClick={() => handleDelete(contextMenu.sourceId)}
        >
          <Trash2 size={16} />
          <span>{translate('sidebar.deleteSource')}</span>
        </button>
      </div>
    );

    // 使用 Portal 渲染到 body，避免被父元素的 stacking context 影响
    return typeof document !== 'undefined'
      ? createPortal(menuContent, document.body)
      : null;
  };

  if (collapsed) {
    return (
      <aside ref={sidebarRef} className="sidebar collapsed">
        {/* Logo 图标 */}
        <div className="sidebar-collapsed-header">
          <button
            onClick={onToggleCollapse}
            className="sidebar-collapsed-logo-btn"
            title={translate('sidebar.expand')}
          >
            <img
              src="/icon.png"
              alt="Pixuli"
              className="sidebar-collapsed-logo"
            />
          </button>
        </div>

        {/* 浏览模式导航 - 折叠状态 */}
        <nav className="sidebar-collapsed-nav">
          {browseModes.map(mode => (
            <button
              key={mode.mode}
              className={`sidebar-collapsed-item ${
                browseMode === mode.mode ? 'active' : ''
              } ${!hasConfig || mode.disabled ? 'disabled' : ''} ${
                mode.comingSoon ? 'coming-soon' : ''
              }`}
              onClick={
                hasConfig && !mode.disabled && onBrowseModeChange
                  ? () => onBrowseModeChange(mode.mode)
                  : undefined
              }
              disabled={!hasConfig || mode.disabled}
              title={
                mode.comingSoon
                  ? `${mode.label} - ${translate('sidebar.comingSoon')}`
                  : mode.label
              }
            >
              {React.cloneElement(
                mode.icon as React.ReactElement<{ size?: number }>,
                {
                  size: 28,
                },
              )}
              {mode.comingSoon && (
                <Lock
                  size={14}
                  className="sidebar-collapsed-coming-soon-icon"
                />
              )}
              <span className="sidebar-collapsed-tooltip">
                {mode.label}
                {mode.comingSoon && ` (${translate('sidebar.comingSoon')})`}
              </span>
            </button>
          ))}
        </nav>

        {/* 筛选选项 - 折叠状态 */}
        {hasConfig && onFilterChange && (
          <nav className="sidebar-collapsed-nav sidebar-collapsed-filters">
            {filters.map(filter => (
              <button
                key={filter.filter}
                className={`sidebar-collapsed-item ${
                  currentFilter === filter.filter ? 'active' : ''
                } ${filter.disabled ? 'disabled' : ''} ${
                  filter.comingSoon ? 'coming-soon' : ''
                }`}
                onClick={
                  !filter.disabled
                    ? () => onFilterChange(filter.filter)
                    : undefined
                }
                disabled={filter.disabled}
                title={
                  filter.comingSoon
                    ? `${filter.label} - ${translate('sidebar.comingSoon')}`
                    : filter.label
                }
              >
                {React.cloneElement(
                  filter.icon as React.ReactElement<{ size?: number }>,
                  {
                    size: 24,
                  },
                )}
                {filter.comingSoon && (
                  <Lock
                    size={12}
                    className="sidebar-collapsed-coming-soon-icon"
                  />
                )}
                <span className="sidebar-collapsed-tooltip">
                  {filter.label}
                  {filter.comingSoon && ` (${translate('sidebar.comingSoon')})`}
                </span>
              </button>
            ))}
          </nav>
        )}

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
                onContextMenu={e => handleContextMenu(e, source.id)}
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
              window.open('https://pixuli-docs.vercel.app/', '_blank');
            }}
            title={translate('sidebar.docs')}
          >
            <HelpCircle size={28} />
            <span className="sidebar-collapsed-tooltip">
              {translate('sidebar.docs')}
            </span>
          </button>
          <button
            className="sidebar-collapsed-item"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('openKeyboardHelp'));
            }}
            title={translate('sidebar.keyboardShortcuts')}
          >
            <Keyboard size={28} />
            <span className="sidebar-collapsed-tooltip">
              {translate('sidebar.keyboardShortcuts')}
            </span>
          </button>
          <button
            className="sidebar-collapsed-item"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('openVersionInfo'));
            }}
            title={translate('sidebar.versionInfo')}
          >
            <Info size={28} />
            <span className="sidebar-collapsed-tooltip">
              {translate('sidebar.versionInfo')}
            </span>
          </button>
        </div>

        {/* 右键菜单 - 折叠状态（使用 Portal） */}
        {renderContextMenu()}
      </aside>
    );
  }

  return (
    <aside ref={sidebarRef} className="sidebar">
      {/* Logo/Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo-container">
          <img src="/icon.png" alt="Pixuli" className="sidebar-logo-icon" />
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

      {/* 浏览模式导航 */}
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <span className="sidebar-section-title">
            {translate('sidebar.browseMode')}
          </span>
        </div>
        <nav className="sidebar-nav">
          {browseModes.map(mode => (
            <NavItem
              key={mode.mode}
              icon={mode.icon}
              label={mode.label}
              active={browseMode === mode.mode}
              disabled={!hasConfig || mode.disabled}
              comingSoon={mode.comingSoon}
              onClick={
                hasConfig && !mode.disabled && onBrowseModeChange
                  ? () => onBrowseModeChange(mode.mode)
                  : undefined
              }
              tooltip={
                mode.comingSoon
                  ? translate('sidebar.comingSoon')
                  : !hasConfig
                    ? translate('sidebar.needSource')
                    : undefined
              }
              t={t}
            />
          ))}
        </nav>
      </div>

      {/* 筛选选项 */}
      {hasConfig && onFilterChange && (
        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <span className="sidebar-section-title">
              {translate('sidebar.filter')}
            </span>
          </div>
          <nav className="sidebar-nav">
            {filters.map(filter => (
              <NavItem
                key={filter.filter}
                icon={filter.icon}
                label={filter.label}
                active={currentFilter === filter.filter}
                disabled={filter.disabled}
                comingSoon={filter.comingSoon}
                onClick={
                  !filter.disabled
                    ? () => onFilterChange(filter.filter)
                    : undefined
                }
                tooltip={
                  filter.comingSoon
                    ? translate('sidebar.comingSoon')
                    : undefined
                }
                t={t}
              />
            ))}
          </nav>
        </div>
      )}

      {/* 仓库源列表 */}
      <div className="sidebar-section sidebar-sources">
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
                onContextMenu={e => handleContextMenu(e, source.id)}
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
          label={translate('sidebar.docs')}
          onClick={() => {
            // 打开文档链接
            window.open('https://pixuli-docs.vercel.app/', '_blank');
          }}
        />
        <NavItem
          icon={<Keyboard size={20} />}
          label={translate('sidebar.keyboardShortcuts')}
          onClick={() => {
            // 触发快捷键说明事件
            window.dispatchEvent(new CustomEvent('openKeyboardHelp'));
          }}
        />
        <NavItem
          icon={<Info size={20} />}
          label={translate('sidebar.versionInfo')}
          onClick={() => {
            // 触发版本信息事件
            window.dispatchEvent(new CustomEvent('openVersionInfo'));
          }}
        />
      </div>

      {/* 右键菜单（使用 Portal） */}
      {renderContextMenu()}
    </aside>
  );
};

export default Sidebar;
