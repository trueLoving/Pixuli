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
    browseMode,
    sidebarCollapsed,
    isFullscreenMode,
    toggleSidebar,
    setBrowseMode,
    setCurrentView,
    setCurrentUtilityTool,
  } = useUIStore();

  // 处理菜单点击，设置状态并导航到对应路由
  const handleMenuClick = (menuItem: SidebarMenuItem) => {
    // 设置 UI 状态
    if (menuItem.type === 'browse') {
      setBrowseMode(menuItem.mode);
      setCurrentView('photos');
      setCurrentUtilityTool(null);
    } else if (menuItem.type === 'utility') {
      setCurrentUtilityTool(menuItem.tool);
      setCurrentView('photos');
      setBrowseMode('file');
    } else if (menuItem.type === 'view') {
      setCurrentView(menuItem.view);
      setCurrentUtilityTool(null);
      setBrowseMode('file');
    }

    // 根据菜单类型导航到对应路由
    if (menuItem.type === 'browse') {
      if (menuItem.mode === 'file') {
        navigate(ROUTES.PHOTOS);
      } else if (menuItem.mode === 'slide') {
        navigate(ROUTES.SLIDESHOW);
      } else if (menuItem.mode === 'timeline') {
        navigate(ROUTES.TIMELINE);
      }
    } else if (menuItem.type === 'utility') {
      const routeMap: Record<string, string> = {
        compress: ROUTES.COMPRESS,
        convert: ROUTES.CONVERT,
        analyze: ROUTES.ANALYZE,
        edit: ROUTES.EDIT,
        generate: ROUTES.GENERATE,
      };
      const route = routeMap[menuItem.tool];
      if (route) {
        navigate(route);
      }
    }
  };

  // 全屏模式下不显示侧边栏
  if (isFullscreenMode) {
    return null;
  }

  return (
    <CommonSidebar
      onMenuClick={handleMenuClick}
      activeMenu={activeMenu}
      browseMode={browseMode}
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
