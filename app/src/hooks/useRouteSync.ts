import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getMenuKeyByPath } from '../router/config';
import { useUIStore } from '../stores/uiStore';

/**
 * 路由同步 Hook
 * 根据路由路径自动同步 activeMenu 状态
 */
export function useRouteSync() {
  const location = useLocation();
  const { setActiveMenu } = useUIStore();

  useEffect(() => {
    const menuKey = getMenuKeyByPath(location.pathname);
    if (menuKey) {
      setActiveMenu(menuKey);
    }
  }, [location.pathname, setActiveMenu]);
}
