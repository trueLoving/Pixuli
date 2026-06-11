/**
 * 侧边栏组件
 * 处理侧边栏的显示和交互逻辑
 */

import { Sidebar as CommonSidebar, type SidebarMenuItem } from '@pixuli/ui';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMobileViewport } from '../hooks/useMobileViewport';
import { ROUTES } from '../router/routes';
import { useUIStore } from '../stores/uiStore';

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
    openConfigModal,
  } = useUIStore();

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
    } else if (menuItem.type === 'settings') {
      setCurrentView('settings');
      setCurrentUtilityTool(null);
      setActiveMenu('settings');
      openConfigModal();
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

  if (isFullscreenMode) {
    return null;
  }

  return (
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
      collapsed={isMobile ? false : sidebarCollapsed}
      onToggleCollapse={isMobile ? undefined : toggleSidebar}
      mobileOpen={isMobile && mobileSidebarOpen}
      onMobileClose={closeMobileSidebar}
      t={t}
    />
  );
};
