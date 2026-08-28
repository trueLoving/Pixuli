import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getMenuKeyByPath } from '../router/config';
import { ROUTES } from '../router/routes';
import { useUIStore } from '../stores/uiStore';

/**
 * 路由同步 Hook
 * 根据路由路径自动同步 activeMenu 状态（工具面板高亮由 currentUtilityTool 保持）
 */
export function useRouteSync() {
  const location = useLocation();
  const { setActiveMenu } = useUIStore();

  useEffect(() => {
    const { currentUtilityTool } = useUIStore.getState();
    if (currentUtilityTool && location.pathname === ROUTES.LIBRARY) {
      return;
    }
    const menuKey = getMenuKeyByPath(location.pathname);
    if (menuKey) {
      setActiveMenu(menuKey);
    }
  }, [location.pathname, setActiveMenu]);
}
