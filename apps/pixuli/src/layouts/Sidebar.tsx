/**
 * 侧边栏组件
 * 处理侧边栏的显示和交互逻辑
 */

import {
  Sidebar as CommonSidebar,
  type SidebarMenuItem,
} from '@packages/common/src';
import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  const {
    activeMenu,
    sidebarCollapsed,
    isFullscreenMode,
    toggleSidebar,
    setCurrentView,
    setCurrentUtilityTool,
    setActiveMenu,
    openConfigModal,
  } = useUIStore();

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
      onSourceSelect={onSourceSelect}
      onSourceEdit={onSourceEdit}
      onSourceDelete={onSourceDelete}
      hasConfig={hasConfig}
      onAddSource={onAddSource}
      collapsed={sidebarCollapsed}
      onToggleCollapse={toggleSidebar}
      t={t}
    />
  );
};
