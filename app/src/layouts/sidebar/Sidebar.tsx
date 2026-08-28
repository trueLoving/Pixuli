import {
  Github,
  HelpCircle,
  Info,
  Keyboard,
  Lock,
  Plus,
  FileText,
  Zap,
  FileImage,
  RefreshCw,
  Settings,
  FolderOpen,
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { defaultTranslate } from '@/i18n/locales';
import { SidebarNavItem } from './SidebarNavItem';
import {
  SidebarMobileOverlay,
  SidebarSourceContextMenu,
} from './SidebarSourceContextMenu';
import type {
  SidebarMenuItem,
  SidebarPrimaryNavItem,
  SidebarProps,
} from './types';

export type {
  SidebarView,
  SidebarFilter,
  SidebarUtilityTool,
  SidebarMenuItem,
  SidebarSource,
} from './types';

import './Sidebar.css';

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
  hideSources = false,
  onSettingsClick,
  onSyncClick,
  syncBusy = false,
  syncDisabled = false,
  syncDisabledTitle,
  syncStrategyLabel,
  syncRemoteLabel,
  hideUtilityTools = false,
  hideHelpFooter = false,
  showWorkspaceNav = false,
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

  const renderSyncButton = (collapsedMode: boolean) => {
    if (!onSyncClick) return null;
    const label = syncBusy
      ? translate('sidebar.syncing')
      : translate('sidebar.syncAction');
    const meta =
      !syncDisabled && syncRemoteLabel
        ? syncStrategyLabel
          ? `${syncStrategyLabel} · ${syncRemoteLabel}`
          : syncRemoteLabel
        : undefined;
    const title = syncDisabled
      ? syncDisabledTitle || translate('sidebar.disabled')
      : meta
        ? `${label}\n${meta}`
        : label;

    if (collapsedMode) {
      return (
        <button
          type="button"
          className={`sidebar-collapsed-item ${syncBusy ? 'syncing' : ''} ${
            syncDisabled ? 'disabled' : ''
          }`}
          onClick={syncDisabled ? undefined : onSyncClick}
          disabled={syncDisabled || syncBusy}
          title={title}
        >
          <RefreshCw size={28} className={syncBusy ? 'animate-spin' : ''} />
          <span className="sidebar-collapsed-tooltip">
            {meta ? (
              <>
                <span className="block">{label}</span>
                <span className="block text-[11px] opacity-80">{meta}</span>
              </>
            ) : (
              label
            )}
          </span>
        </button>
      );
    }

    return (
      <button
        type="button"
        className={`sidebar-nav-item sidebar-sync-item ${syncBusy ? 'syncing' : ''} ${
          syncDisabled ? 'disabled' : ''
        }`}
        onClick={syncDisabled ? undefined : onSyncClick}
        disabled={syncDisabled || syncBusy}
        title={title}
      >
        <span className="sidebar-nav-icon">
          <RefreshCw size={20} className={syncBusy ? 'animate-spin' : ''} />
        </span>
        <span className="sidebar-nav-label sidebar-sync-label">
          <span className="sidebar-sync-primary">{label}</span>
          {meta ? <span className="sidebar-sync-meta">{meta}</span> : null}
        </span>
      </button>
    );
  };
  const libraryNavItem = {
    menuKey: 'library',
    icon: <FileText size={20} />,
    label: translate('sidebar.libraryNav'),
    menuItem: { type: 'library' as const },
    requiresConfig: true,
  };

  const workspaceNavItem = {
    menuKey: 'workspace',
    icon: <FolderOpen size={20} />,
    label: translate('sidebar.workspaceNav'),
    menuItem: { type: 'workspace' as const },
  };

  const utilityNavItems: Array<{
    menuKey: string;
    icon: React.ReactNode;
    label: string;
    menuItem: SidebarMenuItem;
    requiresConfig?: boolean;
  }> = hideUtilityTools
    ? []
    : [
        {
          menuKey: 'compress',
          icon: <Zap size={20} />,
          label: translate('sidebar.imageCompress'),
          menuItem: { type: 'utility' as const, tool: 'compress' as const },
        },
        {
          menuKey: 'convert',
          icon: <FileImage size={20} />,
          label: translate('sidebar.imageConvert'),
          menuItem: { type: 'utility' as const, tool: 'convert' as const },
        },
      ];

  const primaryNavItems = [libraryNavItem, ...utilityNavItems];

  const renderExpandedNavItems = (
    items: typeof primaryNavItems,
    options?: { requiresConfig?: boolean },
  ) =>
    items.map(item => {
      const disabled =
        (options?.requiresConfig ?? item.requiresConfig) && !hasConfig;
      return (
        <SidebarNavItem
          key={item.menuKey}
          icon={item.icon}
          label={item.label}
          active={activeMenu === item.menuKey}
          disabled={disabled}
          onClick={
            !disabled && onMenuClick
              ? () => onMenuClick(item.menuItem)
              : undefined
          }
          tooltip={disabled ? translate('sidebar.needSource') : undefined}
          t={t}
        />
      );
    });

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
              {primaryNavItems.map(item => {
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
              {showWorkspaceNav && onMenuClick && (
                <button
                  key="workspace"
                  type="button"
                  className={`sidebar-collapsed-item ${
                    activeMenu === 'workspace' ? 'active' : ''
                  }`}
                  onClick={() => onMenuClick(workspaceNavItem.menuItem)}
                  title={workspaceNavItem.label}
                >
                  {React.cloneElement(
                    workspaceNavItem.icon as React.ReactElement<{
                      size?: number;
                    }>,
                    { size: 28 },
                  )}
                  <span className="sidebar-collapsed-tooltip">
                    {workspaceNavItem.label}
                  </span>
                </button>
              )}
              {renderSyncButton(true)}
            </nav>
          )}
          {!hideSources && sources.length > 0 && (
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
          {!hideSources && (
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
          )}

          {/* 底部操作 - 折叠状态 */}
          <div className="sidebar-collapsed-footer">
            {onSettingsClick && (
              <button
                className={`sidebar-collapsed-item ${
                  activeMenu === 'settings' ? 'active' : ''
                }`}
                onClick={onSettingsClick}
                title={translate('sidebar.settings')}
              >
                <Settings size={28} />
                <span className="sidebar-collapsed-tooltip">
                  {translate('sidebar.settings')}
                </span>
              </button>
            )}
            {!hideHelpFooter && (
              <>
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
              </>
            )}
          </div>

          {/* 右键菜单 - 折叠状态（使用 Portal） */}
          <SidebarSourceContextMenu
            contextMenu={contextMenu}
            contextMenuRef={contextMenuRef}
            translate={translate}
            onOpenInWindow={onSourceOpenInWindow}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </aside>
        <SidebarMobileOverlay
          mobileOpen={mobileOpen}
          onMobileClose={onMobileClose}
        />
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

        {/* 主导航：资源库 */}
        {onMenuClick && (
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <span className="sidebar-section-title">
                {translate('sidebar.libraryNav')}
              </span>
            </div>
            <nav className="sidebar-nav">
              {renderExpandedNavItems([libraryNavItem])}
            </nav>
          </div>
        )}

        {/* 工具 */}
        {onMenuClick && utilityNavItems.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <span className="sidebar-section-title">
                {translate('sidebar.utilityTools')}
              </span>
            </div>
            <nav className="sidebar-nav">
              {renderExpandedNavItems(utilityNavItems)}
            </nav>
          </div>
        )}

        {/* 工作区 */}
        {showWorkspaceNav && onMenuClick && (
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <span className="sidebar-section-title">
                {translate('sidebar.workspaceNav')}
              </span>
            </div>
            <nav className="sidebar-nav">
              {renderExpandedNavItems([workspaceNavItem])}
            </nav>
          </div>
        )}

        {/* 同步 */}
        {onSyncClick && (
          <div className="sidebar-section sidebar-sync">
            <div className="sidebar-section-header">
              <span className="sidebar-section-title">
                {translate('sidebar.sync')}
              </span>
            </div>
            <nav className="sidebar-nav">{renderSyncButton(false)}</nav>
          </div>
        )}

        {/* 仓库源列表 */}
        {!hideSources && (
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
        )}

        {footerExtra}

        {/* 设置 */}
        {onSettingsClick && (
          <div className="sidebar-section sidebar-settings">
            <nav className="sidebar-nav">
              <SidebarNavItem
                icon={<Settings size={20} />}
                label={translate('sidebar.settings')}
                active={activeMenu === 'settings'}
                onClick={onSettingsClick}
                t={t}
              />
            </nav>
          </div>
        )}

        {/* 底部操作 */}
        {!hideHelpFooter && (
          <div className="sidebar-footer">
            <SidebarNavItem
              icon={<HelpCircle size={20} />}
              label={translate('sidebar.docs')}
              onClick={() => {
                window.open(
                  'https://github.com/trueLoving/Pixuli/wiki/Pixuli-Usage-Tutorial',
                  '_blank',
                );
              }}
            />
            <SidebarNavItem
              icon={<Keyboard size={20} />}
              label={translate('sidebar.keyboardShortcuts')}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openKeyboardHelp'));
              }}
            />
            <SidebarNavItem
              icon={<Info size={20} />}
              label={translate('sidebar.versionInfo')}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openVersionInfo'));
              }}
            />
          </div>
        )}

        {/* 右键菜单（使用 Portal） */}
        <SidebarSourceContextMenu
          contextMenu={contextMenu}
          contextMenuRef={contextMenuRef}
          translate={translate}
          onOpenInWindow={onSourceOpenInWindow}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </aside>
      <SidebarMobileOverlay
        mobileOpen={mobileOpen}
        onMobileClose={onMobileClose}
      />
    </>
  );
};

export default Sidebar;
