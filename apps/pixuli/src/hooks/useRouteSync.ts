import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getMenuKeyByPath, getBrowseModeByPath } from '../router/config';
import { useUIStore } from '../stores/uiStore';

/**
 * 路由同步 Hook
 * 根据路由路径自动同步 activeMenu 和 browseMode 状态
 */
export function useRouteSync() {
  const location = useLocation();
  const { setActiveMenu, setBrowseMode } = useUIStore();

  useEffect(() => {
    const path = location.pathname;
    const menuKey = getMenuKeyByPath(path);
    const browseMode = getBrowseModeByPath(path);

    if (menuKey) {
      setActiveMenu(menuKey);
    }

    if (browseMode) {
      setBrowseMode(browseMode);
    }
  }, [location.pathname, setActiveMenu, setBrowseMode]);
}
