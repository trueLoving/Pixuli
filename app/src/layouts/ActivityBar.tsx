import { LayoutGrid, RefreshCw, Settings } from 'lucide-react';
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMobileViewport } from '@/hooks/useMobileViewport';
import { ROUTES } from '@/router/routes';
import { useUIStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import './ActivityBar.css';

interface ActivityBarProps {
  t: (key: string) => string;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({ t }) => {
  const navigate = useNavigate();
  const isMobile = useMobileViewport();
  const activeMenu = useUIStore(state => state.activeMenu);
  const setActiveMenu = useUIStore(state => state.setActiveMenu);
  const setCurrentView = useUIStore(state => state.setCurrentView);
  const setCurrentUtilityTool = useUIStore(
    state => state.setCurrentUtilityTool,
  );
  const openSettingsModal = useUIStore(state => state.openSettingsModal);
  const requestSync = useUIStore(state => state.requestSync);
  const pushing = useWorkspaceStore(state => state.pushing);
  const syncing = useWorkspaceStore(state => state.syncing);
  const workspaceLoading = useWorkspaceStore(state => state.loading);
  const syncBusy = pushing || syncing || workspaceLoading;

  const navigateToLibrary = useCallback(() => {
    setActiveMenu('photos');
    setCurrentView('photos');
    setCurrentUtilityTool(null);
    navigate(ROUTES.PHOTOS);
  }, [navigate, setActiveMenu, setCurrentUtilityTool, setCurrentView]);

  const primary = [
    {
      id: 'photos',
      label: t('sidebar.library'),
      icon: LayoutGrid,
      onClick: navigateToLibrary,
    },
    {
      id: 'sync',
      label: t('sidebar.sync'),
      icon: RefreshCw,
      onClick: () => requestSync(),
    },
  ];

  const renderItem = (
    item:
      | (typeof primary)[number]
      | {
          id: string;
          label: string;
          icon: typeof Settings;
          onClick: () => void;
        },
  ) => {
    const Icon = item.icon;
    const isActive = activeMenu === item.id;
    const isBusy = item.id === 'sync' && syncBusy;
    return (
      <button
        key={item.id}
        type="button"
        className={`activity-bar-item ${isActive ? 'activity-bar-item--active' : ''} ${isBusy ? 'activity-bar-item--busy' : ''}`.trim()}
        title={item.label}
        aria-label={item.label}
        aria-pressed={isActive}
        aria-busy={isBusy || undefined}
        onClick={item.onClick}
      >
        <Icon
          size={22}
          className={`activity-bar-icon ${isBusy ? 'activity-bar-spin' : ''}`.trim()}
          aria-hidden
        />
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
