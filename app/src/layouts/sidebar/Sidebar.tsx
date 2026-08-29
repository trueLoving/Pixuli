import {
  HelpCircle,
  Info,
  Keyboard,
  Plus,
  RefreshCw,
  Settings,
} from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { SidebarSourceSection } from '@/features/settings/sidebar/SidebarSourceSection';
import { defaultTranslate } from '@/i18n/locales';
import { SidebarNavItem } from './SidebarNavItem';
import { SidebarMobileOverlay } from './SidebarSourceContextMenu';
import {
  buildLibraryNavItem,
  buildPrimaryNavItems,
  buildUtilityNavItems,
  buildWorkspaceNavItem,
  cloneNavIcon,
} from './sidebarNavItems';
import type { SidebarProps } from './types';

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
  const sidebarRef = useRef<HTMLElement>(null);
  const libraryNavItem = buildLibraryNavItem(translate);
  const workspaceNavItem = buildWorkspaceNavItem(translate);
  const utilityNavItems = buildUtilityNavItems(translate, hideUtilityTools);
  const primaryNavItems = buildPrimaryNavItems(translate, hideUtilityTools);

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
                    {cloneNavIcon(item.icon, 28)}
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
                  {cloneNavIcon(workspaceNavItem.icon, 28)}
                  <span className="sidebar-collapsed-tooltip">
                    {workspaceNavItem.label}
                  </span>
                </button>
              )}
              {renderSyncButton(true)}
            </nav>
          )}
          {!hideSources && (
            <SidebarSourceSection
              variant="collapsed"
              sources={sources}
              selectedSourceId={selectedSourceId}
              onSourceSelect={onSourceSelect}
              onAddSource={onAddSource}
              onSourceEdit={onSourceEdit}
              onSourceDelete={onSourceDelete}
              onSourceOpenInWindow={onSourceOpenInWindow}
              translate={translate}
            />
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

        {!hideSources && (
          <SidebarSourceSection
            variant="expanded"
            sources={sources}
            selectedSourceId={selectedSourceId}
            onSourceSelect={onSourceSelect}
            onAddSource={onAddSource}
            onSourceEdit={onSourceEdit}
            onSourceDelete={onSourceDelete}
            onSourceOpenInWindow={onSourceOpenInWindow}
            translate={translate}
          />
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
      </aside>
      <SidebarMobileOverlay
        mobileOpen={mobileOpen}
        onMobileClose={onMobileClose}
      />
    </>
  );
};

export default Sidebar;
