import { LayoutGrid, RefreshCw, Settings } from 'lucide-react';
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMobileViewport } from '@/hooks/useMobileViewport';
import { ROUTES } from '@/router/routes';
import { useUIStore } from '@/stores/uiStore';
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
    return (
      <button
        key={item.id}
        type="button"
        className={`activity-bar-item ${isActive ? 'activity-bar-item--active' : ''}`.trim()}
        title={item.label}
        aria-label={item.label}
        aria-pressed={isActive}
        onClick={item.onClick}
      >
        <Icon size={22} className="activity-bar-icon" aria-hidden />
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
