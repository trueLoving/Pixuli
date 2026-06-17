import {
  ExternalLink,
  Github,
  HelpCircle,
  Info,
  Keyboard,
  Lock,
  Plus,
  FileText,
  Edit,
  Trash2,
  Zap,
  FileImage,
  Settings,
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { defaultTranslate } from '@pixuli/ui/locales';
import './Sidebar.css';

export type SidebarView =
  | 'photos'
  | 'explore'
  | 'tags'
  | 'favorites'
  | 'settings';

export type SidebarFilter = 'all' | 'tags' | 'favorites';
export type SidebarUtilityTool = 'compress' | 'convert';

// 统一的菜单项类型（图床 + 工具 + 设置）
export type SidebarMenuItem =
  | { type: 'photos' }
  | { type: 'utility'; tool: SidebarUtilityTool }
  | { type: 'settings' };

export interface SidebarSource {
  id: string;
  name: string;
  type: 'github' | 'gitee';
  owner: string;
  repo: string;
  path: string;
  active?: boolean;
  /** 对应 pluginId 是否已在 Registry 注册（REF-307） */
  available?: boolean;
}

interface SidebarProps {
  // 统一的菜单点击处理
  onMenuClick?: (menuItem: SidebarMenuItem) => void;
  // 当前激活的菜单（用于高亮显示）
  activeMenu?: string;
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
  /** 窄屏抽屉是否展开（配合 CSS `.sidebar.open`） */
  mobileOpen?: boolean;
  /** 点击遮罩或完成导航后关闭抽屉 */
  onMobileClose?: () => void;
  /** 侧栏底部区域上方插槽（如演示模式区块） */
  footerExtra?: React.ReactNode;
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
  onMenuClick,
  activeMenu,
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
  mobileOpen = false,
  onMobileClose,
  footerExtra,
  t,
}) => {
  const translate = t || defaultTranslate;
  const sidebarClassName = [
    'sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'open' : '',
  ]
    .filter(Boolean)
    .join(' ');
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

  const mainNavItems: Array<{
    menuKey: string;
    icon: React.ReactNode;
    label: string;
    menuItem: SidebarMenuItem;
    requiresConfig?: boolean;
  }> = [
    {
      menuKey: 'photos',
      icon: <FileText size={20} />,
      label: translate('sidebar.photos'),
      menuItem: { type: 'photos' },
      requiresConfig: true,
    },
    {
      menuKey: 'compress',
      icon: <Zap size={20} />,
      label: translate('sidebar.imageCompress'),
      menuItem: { type: 'utility', tool: 'compress' },
    },
    {
      menuKey: 'convert',
      icon: <FileImage size={20} />,
      label: translate('sidebar.imageConvert'),
      menuItem: { type: 'utility', tool: 'convert' },
    },
    {
      menuKey: 'settings',
      icon: <Settings size={20} />,
      label: translate('sidebar.settings'),
      menuItem: { type: 'settings' },
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

  const renderMobileOverlay = () => {
    if (!mobileOpen || !onMobileClose) return null;

    const overlay = (
      <div
        className="sidebar-overlay"
        onClick={onMobileClose}
        aria-hidden="true"
      />
    );

    return typeof document !== 'undefined'
      ? createPortal(overlay, document.body)
      : null;
  };

  if (collapsed) {
    return (
      <>
        <aside ref={sidebarRef} className={sidebarClassName}>
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

          {/* 主导航 - 折叠状态 */}
          {onMenuClick && (
            <nav className="sidebar-collapsed-nav">
              {mainNavItems.map(item => {
                const disabled = item.requiresConfig && !hasConfig;
                return (
                  <button
                    key={item.menuKey}
                    className={`sidebar-collapsed-item ${
                      activeMenu === item.menuKey ? 'active' : ''
                    } ${disabled ? 'disabled' : ''}`}
                    onClick={
                      !disabled ? () => onMenuClick(item.menuItem) : undefined
                    }
                    disabled={disabled}
                    title={
                      disabled ? translate('sidebar.needSource') : item.label
                    }
                  >
                    {React.cloneElement(
                      item.icon as React.ReactElement<{ size?: number }>,
                      { size: 28 },
                    )}
                    <span className="sidebar-collapsed-tooltip">
                      {item.label}
                    </span>
                  </button>
                );
              })}
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
                  <span className="sidebar-collapsed-tooltip">
                    {source.name}
                  </span>
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
                window.open(
                  'https://github.com/trueLoving/Pixuli/wiki/Pixuli-Usage-Tutorial',
                  '_blank',
                );
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
        {renderMobileOverlay()}
      </>
    );
  }

  return (
    <>
      <aside ref={sidebarRef} className={sidebarClassName}>
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

        {/* 主导航：图床 + 工具 + 设置 */}
        {onMenuClick && (
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <span className="sidebar-section-title">
                {translate('sidebar.mainNav')}
              </span>
            </div>
            <nav className="sidebar-nav">
              {mainNavItems.map(item => {
                const disabled = item.requiresConfig && !hasConfig;
                return (
                  <NavItem
                    key={item.menuKey}
                    icon={item.icon}
                    label={item.label}
                    active={activeMenu === item.menuKey}
                    disabled={disabled}
                    onClick={
                      !disabled ? () => onMenuClick(item.menuItem) : undefined
                    }
                    tooltip={
                      disabled ? translate('sidebar.needSource') : undefined
                    }
                    t={t}
                  />
                );
              })}
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
              {sources.map(source => {
                const unavailable = source.available === false;
                return (
                  <button
                    key={source.id}
                    type="button"
                    className={`sidebar-source-item ${
                      selectedSourceId === source.id ? 'active' : ''
                    } ${unavailable ? 'sidebar-source-item--unavailable' : ''}`}
                    onClick={() => {
                      if (!unavailable) {
                        onSourceSelect(source.id);
                      }
                    }}
                    onContextMenu={e => handleContextMenu(e, source.id)}
                    title={
                      unavailable
                        ? translate('sidebar.pluginUnavailable')
                        : `${source.owner}/${source.repo}`
                    }
                    disabled={unavailable}
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
                        {unavailable
                          ? translate('sidebar.pluginUnavailable')
                          : `${source.owner}/${source.repo}`}
                      </div>
                    </div>
                    {source.active && !unavailable && (
                      <div className="sidebar-source-active-dot" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {footerExtra}

        {/* 底部操作 */}
        <div className="sidebar-footer">
          <NavItem
            icon={<HelpCircle size={20} />}
            label={translate('sidebar.docs')}
            onClick={() => {
              // 打开文档链接
              window.open(
                'https://github.com/trueLoving/Pixuli/wiki/Pixuli-Usage-Tutorial',
                '_blank',
              );
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
      {renderMobileOverlay()}
    </>
  );
};

export default Sidebar;
