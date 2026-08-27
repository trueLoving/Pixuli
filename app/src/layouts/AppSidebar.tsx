import { Sidebar as CommonSidebar, type SidebarMenuItem } from './sidebar';
import {
  getRepoConfigFromSource,
  pluginIdToLegacyType,
} from '@pixuli/core/sources';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMobileViewport } from '../hooks/useMobileViewport';
import { ROUTES } from '../router/routes';
import { useSourceStore } from '../stores/sourceStore';
import { useUIStore } from '../stores/uiStore';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { isWorkspaceAvailable } from '../platforms/workspacePlatform';

interface SidebarProps {
  sidebarSources: any[];
  selectedSourceId: string | null;
  onSourceSelect: (sourceId: string) => void;
  onSourceEdit: (sourceId: string) => void;
  onSourceDelete: (sourceId: string) => void;
  hasConfig: boolean;
  onAddSource: () => void;
  t: (key: string) => string;
}

export const AppSidebar: React.FC<SidebarProps> = ({
  sidebarSources,
  selectedSourceId,
  onSourceSelect,
  onSourceEdit,
  onSourceDelete,
  hasConfig,
  onAddSource,
  t,
}) => {
  const navigate = useNavigate();
  const isMobile = useMobileViewport();
  const sources = useSourceStore(state => state.sources);
  const pushing = useWorkspaceStore(state => state.pushing);
  const syncing = useWorkspaceStore(state => state.syncing);
  const workspaceLoading = useWorkspaceStore(state => state.loading);
  const {
    activeMenu,
    sidebarCollapsed,
    mobileSidebarOpen,
    isFullscreenMode,
    toggleSidebar,
    closeMobileSidebar,
    setCurrentView,
    setCurrentUtilityTool,
    setActiveMenu,
    openSettingsModal,
    requestSync,
  } = useUIStore();

  const syncBusy = pushing || syncing || workspaceLoading;

  const activeSyncSource = useMemo(() => {
    if (selectedSourceId) {
      return sources.find(s => s.id === selectedSourceId) ?? null;
    }
    return sources[0] ?? null;
  }, [sources, selectedSourceId]);

  const syncRemoteLabel = useMemo(() => {
    if (!activeSyncSource) {
      return t('settings.noSyncTarget');
    }
    const repo = getRepoConfigFromSource(activeSyncSource);
    const legacyType = pluginIdToLegacyType(activeSyncSource.pluginId);
    const typeLabel = legacyType === 'github' ? 'GitHub' : 'Gitee';
    return `${typeLabel} ${repo.owner}/${repo.repo}`;
  }, [activeSyncSource, t]);

  useEffect(() => {
    if (!isMobile && mobileSidebarOpen) {
      closeMobileSidebar();
    }
  }, [isMobile, mobileSidebarOpen, closeMobileSidebar]);

  useEffect(() => {
    if (!isMobile) return;
    document.body.style.overflow = mobileSidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, mobileSidebarOpen]);

  const closeDrawerIfMobile = useCallback(() => {
    if (isMobile) {
      closeMobileSidebar();
    }
  }, [isMobile, closeMobileSidebar]);

  const handleMenuClick = (menuItem: SidebarMenuItem) => {
    if (menuItem.type === 'photos') {
      setCurrentView('photos');
      setCurrentUtilityTool(null);
      setActiveMenu('photos');
      navigate(ROUTES.PHOTOS);
    } else if (menuItem.type === 'workspace') {
      setCurrentView('workspace');
      setCurrentUtilityTool(null);
      setActiveMenu('workspace');
      navigate(ROUTES.WORKSPACE);
    } else if (menuItem.type === 'utility') {
      setCurrentUtilityTool(menuItem.tool);
      setCurrentView('photos');
      setActiveMenu(menuItem.tool);
      const routeMap: Record<string, string> = {
        compress: ROUTES.COMPRESS,
        convert: ROUTES.CONVERT,
      };
      const route = routeMap[menuItem.tool];
      if (route) {
        navigate(route);
      }
    }
    closeDrawerIfMobile();
  };

  const handleSourceSelect = (id: string) => {
    onSourceSelect(id);
    closeDrawerIfMobile();
  };

  const handleAddSource = () => {
    onAddSource();
    closeDrawerIfMobile();
  };

  const handleSettingsClick = () => {
    openSettingsModal();
    setActiveMenu('settings');
    closeDrawerIfMobile();
  };

  const handleSyncClick = useCallback(() => {
    if (syncBusy) return;
    requestSync();
    closeDrawerIfMobile();
  }, [syncBusy, requestSync, closeDrawerIfMobile]);

  if (isFullscreenMode) {
    return null;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-hidden">
        <CommonSidebar
          onMenuClick={handleMenuClick}
          activeMenu={activeMenu}
          sources={sidebarSources}
          selectedSourceId={selectedSourceId}
          onSourceSelect={handleSourceSelect}
          onSourceEdit={onSourceEdit}
          onSourceDelete={onSourceDelete}
          hasConfig={hasConfig}
          onAddSource={handleAddSource}
          onSettingsClick={handleSettingsClick}
          onSyncClick={handleSyncClick}
          syncBusy={syncBusy}
          syncDisabled={syncBusy}
          syncRemoteLabel={syncRemoteLabel}
          hideUtilityTools
          hideHelpFooter
          showWorkspaceNav={isWorkspaceAvailable()}
          hideSources
          collapsed={isMobile ? false : sidebarCollapsed}
          onToggleCollapse={isMobile ? undefined : toggleSidebar}
          mobileOpen={isMobile && mobileSidebarOpen}
          onMobileClose={closeMobileSidebar}
          t={t}
        />
      </div>
    </div>
  );
};
