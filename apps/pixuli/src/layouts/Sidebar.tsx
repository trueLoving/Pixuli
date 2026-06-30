import {
  Sidebar as CommonSidebar,
  DemoSidebarSection,
  type SidebarMenuItem,
  useDemoMode,
} from '@pixuli/ui';
import {
  getRepoConfigFromSource,
  pluginIdToLegacyType,
} from '@pixuli/core/sources';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMobileViewport } from '../hooks/useMobileViewport';
import { ROUTES } from '../router/routes';
import { useImageStore } from '../stores/imageStore';
import { useSourceStore } from '../stores/sourceStore';
import { useSyncPreferencesStore } from '../stores/syncPreferencesStore';
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

export const Sidebar: React.FC<SidebarProps> = ({
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
  const { isDemoMode } = useDemoMode();
  const sources = useSourceStore(state => state.sources);
  const localActive = useWorkspaceStore(state => state.isLocalActive());
  const pushing = useWorkspaceStore(state => state.pushing);
  const syncing = useWorkspaceStore(state => state.syncing);
  const workspaceLoading = useWorkspaceStore(state => state.loading);
  const runSync = useWorkspaceStore(state => state.runSync);
  const defaultDirection = useSyncPreferencesStore(
    state => state.defaultDirection,
  );
  const loadImages = useImageStore(state => state.loadImages);
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
  } = useUIStore();

  const workspaceReady =
    isWorkspaceAvailable() && localActive && sources.length > 0;
  const syncBusy = pushing || syncing || workspaceLoading;
  const syncDisabled = !workspaceReady;
  const syncDisabledTitle = !isWorkspaceAvailable()
    ? t('workspace.setupTitle')
    : !localActive
      ? t('workspace.setupTitle')
      : sources.length === 0
        ? t('workspace.syncNeedsRemote')
        : undefined;

  const activeSyncSource = useMemo(() => {
    if (selectedSourceId) {
      return sources.find(s => s.id === selectedSourceId) ?? null;
    }
    return sources[0] ?? null;
  }, [sources, selectedSourceId]);

  const syncStrategyLabel = t(`settings.directionShort.${defaultDirection}`);
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

  const closeDrawerIfMobile = () => {
    if (isMobile) {
      closeMobileSidebar();
    }
  };

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

  const handleSyncClick = useCallback(async () => {
    if (!workspaceReady || syncBusy) return;
    await runSync(defaultDirection);
    await loadImages();
    closeDrawerIfMobile();
  }, [
    workspaceReady,
    syncBusy,
    runSync,
    defaultDirection,
    loadImages,
    closeDrawerIfMobile,
  ]);

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
          onSyncClick={isWorkspaceAvailable() ? handleSyncClick : undefined}
          syncBusy={syncBusy}
          syncDisabled={syncDisabled}
          syncDisabledTitle={syncDisabledTitle}
          syncStrategyLabel={syncStrategyLabel}
          syncRemoteLabel={syncRemoteLabel}
          hideUtilityTools
          hideHelpFooter
          showWorkspaceNav={isWorkspaceAvailable()}
          hideSources
          collapsed={isMobile ? false : sidebarCollapsed}
          onToggleCollapse={isMobile ? undefined : toggleSidebar}
          mobileOpen={isMobile && mobileSidebarOpen}
          onMobileClose={closeMobileSidebar}
          footerExtra={isDemoMode ? <DemoSidebarSection t={t} /> : undefined}
          t={t}
        />
      </div>
    </div>
  );
};
