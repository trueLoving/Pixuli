import { Sidebar as CommonSidebar, type SidebarMenuItem } from './sidebar';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SidebarSourceItem } from '@/features/settings/sidebarSourceTypes';
import { useSourceStore } from '@/features/settings/sourceStore';
import { requestWorkspaceSync } from '@/features/workspace/syncFeedback';
import { formatSyncTargetLabel } from '@/features/workspace/syncTargetLabel';
import { openUtilityTool } from '@/features/tools/utilityToolPort';
import { useUtilityToolsStore } from '@/features/tools/utilityToolsConfig';
import { useMobileViewport } from '@/hooks/useMobileViewport';
import { ROUTES } from '@/router/routes';
import { isWorkspaceAvailable } from '@/platforms/workspacePlatform';
import { useUIStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/features/workspace/workspaceStore';

interface SidebarProps {
  sidebarSources: SidebarSourceItem[];
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
  } = useUIStore();

  const syncBusy = pushing || syncing || workspaceLoading;
  const toolsEnabled = useUtilityToolsStore(state => state.enabled);

  const activeSyncSource = useMemo(() => {
    if (selectedSourceId) {
      return sources.find(s => s.id === selectedSourceId) ?? null;
    }
    return sources[0] ?? null;
  }, [sources, selectedSourceId]);

  const syncRemoteLabel = useMemo(
    () => formatSyncTargetLabel(activeSyncSource, t('settings.noSyncTarget')),
    [activeSyncSource, t],
  );

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
    if (menuItem.type === 'library') {
      setCurrentView('library');
      setCurrentUtilityTool(null);
      setActiveMenu('library');
      navigate(ROUTES.LIBRARY);
    } else if (menuItem.type === 'workspace') {
      setCurrentView('workspace');
      setCurrentUtilityTool(null);
      setActiveMenu('workspace');
      navigate(ROUTES.WORKSPACE);
    } else if (menuItem.type === 'utility') {
      openUtilityTool(menuItem.tool);
      navigate(ROUTES.LIBRARY);
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
    requestWorkspaceSync();
    closeDrawerIfMobile();
  }, [syncBusy, closeDrawerIfMobile]);

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
          hideUtilityTools={!toolsEnabled}
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
