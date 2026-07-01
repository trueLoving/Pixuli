import { FileText, FolderTree, RefreshCw, Settings } from 'lucide-react';
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMobileViewport } from '@/hooks/useMobileViewport';
import { useI18n } from '@/i18n/useI18n';
import { ROUTES } from '@/router/routes';
import { useImageStore } from '@/stores/imageStore';
import { useSourceStore } from '@/stores/sourceStore';
import { useSyncPreferencesStore } from '@/stores/syncPreferencesStore';
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
  const toggleWorkspaceExplorer = useUIStore(
    state => state.toggleWorkspaceExplorer,
  );
  const workspaceExplorerOpen = useUIStore(
    state => state.workspaceExplorerOpen,
  );

  const sources = useSourceStore(state => state.sources);
  const localActive = useWorkspaceStore(state => state.isLocalActive());
  const pushing = useWorkspaceStore(state => state.pushing);
  const syncing = useWorkspaceStore(state => state.syncing);
  const workspaceLoading = useWorkspaceStore(state => state.loading);
  const runSync = useWorkspaceStore(state => state.runSync);
  const loadImages = useImageStore(state => state.loadImages);
  const defaultDirection = useSyncPreferencesStore(
    state => state.defaultDirection,
  );

  const workspaceReady = localActive && sources.length > 0;
  const syncBusy = pushing || syncing || workspaceLoading;
  const syncDisabled = !workspaceReady || syncBusy;

  const navigateTo = useCallback(
    (menuKey: string, path: string) => {
      setActiveMenu(menuKey);
      setCurrentView(menuKey === 'photos' ? 'photos' : 'photos');
      if (menuKey === 'compress') {
        setCurrentUtilityTool('compress');
      } else if (menuKey === 'convert') {
        setCurrentUtilityTool('convert');
      } else {
        setCurrentUtilityTool(null);
      }
      navigate(path);
    },
    [navigate, setActiveMenu, setCurrentUtilityTool, setCurrentView],
  );

  const handleSync = async () => {
    if (syncDisabled) return;
    await runSync(defaultDirection);
    await loadImages();
  };

  const items = [
    {
      id: 'photos',
      label: t('sidebar.photos'),
      icon: FileText,
      onClick: () => navigateTo('photos', ROUTES.PHOTOS),
    },
    {
      id: 'explorer',
      label: t('workspace.explorer'),
      icon: FolderTree,
      onClick: toggleWorkspaceExplorer,
      active: workspaceExplorerOpen,
      mobileOnly: true,
    },
    // 暂时隐藏：压缩 / 转换（路由仍保留，可从 URL 直达）
    // {
    //   id: 'compress',
    //   label: t('sidebar.imageCompress'),
    //   icon: Zap,
    //   onClick: () => navigateTo('compress', ROUTES.COMPRESS),
    // },
    // {
    //   id: 'convert',
    //   label: t('sidebar.imageConvert'),
    //   icon: FileImage,
    //   onClick: () => navigateTo('convert', ROUTES.CONVERT),
    // },
  ];

  return (
    <nav
      className={`activity-bar ${isMobile ? 'activity-bar--mobile' : ''}`.trim()}
      aria-label={t('workspace.activityBar')}
    >
      <div className="activity-bar-main">
        {items.map(item => {
          if (item.mobileOnly && !isMobile) {
            return null;
          }
          const Icon = item.icon;
          const isActive = item.active ?? activeMenu === item.id;
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
            </button>
          );
        })}
      </div>

      <div className="activity-bar-footer">
        <button
          type="button"
          className={`activity-bar-item ${syncBusy ? 'activity-bar-item--busy' : ''}`}
          title={
            syncDisabled
              ? t('workspace.syncNeedsRemote')
              : t('sidebar.syncAction')
          }
          aria-label={t('sidebar.syncAction')}
          disabled={syncDisabled}
          onClick={() => void handleSync()}
        >
          <RefreshCw
            size={22}
            className={
              syncBusy
                ? 'activity-bar-icon activity-bar-spin'
                : 'activity-bar-icon'
            }
            aria-hidden
          />
        </button>
        <button
          type="button"
          className={`activity-bar-item ${activeMenu === 'settings' ? 'activity-bar-item--active' : ''}`}
          title={t('settings.title')}
          aria-label={t('settings.title')}
          onClick={() => {
            setActiveMenu('settings');
            openSettingsModal();
          }}
        >
          <Settings size={22} className="activity-bar-icon" aria-hidden />
        </button>
      </div>
    </nav>
  );
};
