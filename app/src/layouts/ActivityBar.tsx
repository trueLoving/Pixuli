import { LayoutGrid, RefreshCw, Settings } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSourceStore } from '@/features/settings/sourceStore';
import { requestWorkspaceSync } from '@/features/workspace/syncFeedback';
import { formatSyncTargetLabel } from '@/features/workspace/syncTargetLabel';
import { useMobileViewport } from '@/hooks/useMobileViewport';
import { ROUTES } from '@/router/routes';
import { useUIStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/features/workspace/workspaceStore';
import './ActivityBar.css';

interface ActivityBarProps {
  t: (key: string, options?: Record<string, unknown>) => string;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({ t }) => {
  const navigate = useNavigate();
  const isMobile = useMobileViewport();
  const activeMenu = useUIStore(state => state.activeMenu);
  const setActiveMenu = useUIStore(state => state.setActiveMenu);
  const setCurrentView = useUIStore(state => state.setCurrentView);
  const openSettingsModal = useUIStore(state => state.openSettingsModal);
  const sources = useSourceStore(state => state.sources);
  const selectedSourceId = useSourceStore(state => state.selectedSourceId);
  const pushing = useWorkspaceStore(state => state.pushing);
  const syncing = useWorkspaceStore(state => state.syncing);
  const workspaceLoading = useWorkspaceStore(state => state.loading);
  const pendingPush = useWorkspaceStore(
    state => state.syncStatus?.pendingPush ?? 0,
  );
  const syncBusy = pushing || syncing || workspaceLoading;
  const syncTargetLabel = useMemo(() => {
    const source = selectedSourceId
      ? sources.find(item => item.id === selectedSourceId)
      : sources[0];
    return formatSyncTargetLabel(source, '');
  }, [selectedSourceId, sources]);
  const syncLabel = syncTargetLabel
    ? t('workspace.syncTo', { target: syncTargetLabel })
    : t('sidebar.sync');

  const navigateToLibrary = useCallback(() => {
    setActiveMenu('library');
    setCurrentView('library');
    navigate(ROUTES.LIBRARY);
  }, [navigate, setActiveMenu, setCurrentView]);

  const primary = [
    {
      id: 'library',
      label: t('sidebar.library'),
      icon: LayoutGrid,
      onClick: navigateToLibrary,
    },
    {
      id: 'sync',
      label: syncTargetLabel || t('sidebar.sync'),
      title: syncLabel,
      icon: RefreshCw,
      onClick: () => requestWorkspaceSync(),
    },
  ];

  const renderItem = (
    item:
      | (typeof primary)[number]
      | {
          id: string;
          label: string;
          title?: string;
          icon: typeof Settings;
          onClick: () => void;
        },
  ) => {
    const Icon = item.icon;
    const isSettings = item.id === 'settings';
    /** 设置保持中性；同步用 busy，不用导航选中紫 */
    const isActive =
      !isSettings && item.id !== 'sync' && activeMenu === item.id;
    const isBusy = item.id === 'sync' && syncBusy;
    const caption = 'title' in item && item.title ? item.title : item.label;
    return (
      <button
        key={item.id}
        type="button"
        className={[
          'activity-bar-item',
          isActive ? 'activity-bar-item--active' : '',
          isBusy ? 'activity-bar-item--busy' : '',
          isSettings ? 'activity-bar-item--settings' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        title={isBusy ? t('workspace.syncing') : caption}
        aria-label={isBusy ? t('workspace.syncing') : caption}
        aria-pressed={isActive}
        aria-busy={isBusy || undefined}
        onClick={item.onClick}
      >
        <Icon
          size={22}
          className={`activity-bar-icon ${isBusy ? 'activity-bar-spin' : ''}`.trim()}
          aria-hidden
        />
        {isBusy ? (
          <span className="activity-bar-badge">
            {t('workspace.syncingShort')}
          </span>
        ) : item.id === 'sync' && pendingPush > 0 ? (
          <span
            className="activity-bar-badge activity-bar-badge--pending"
            aria-label={t('workspace.pendingPush', { count: pendingPush })}
          >
            {pendingPush > 99 ? '99+' : String(pendingPush)}
          </span>
        ) : null}
        {isMobile ? (
          <span className="activity-bar-item-label">{item.label}</span>
        ) : null}
      </button>
    );
  };

  return (
    <nav
      className={`activity-bar ${isMobile ? 'activity-bar--mobile' : ''}`.trim()}
      aria-label={t('workspace.activityBar')}
    >
      <div className="activity-bar-main">{primary.map(renderItem)}</div>
      <div className="activity-bar-footer">
        {renderItem({
          id: 'settings',
          label: t('settings.title'),
          icon: Settings,
          onClick: () => {
            openSettingsModal();
          },
        })}
      </div>
    </nav>
  );
};
