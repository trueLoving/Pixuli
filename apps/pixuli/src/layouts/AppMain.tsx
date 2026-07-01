/**
 * 主内容区域（无顶栏 Header；日志与语言在设置中）
 */

import { Menu } from 'lucide-react';
import React from 'react';
import { useMobileViewport } from '../hooks/useMobileViewport';
import { useI18n } from '../i18n/useI18n';
import { useUIStore } from '../stores/uiStore';
import './AppMain.css';

interface AppMainProps {
  children: React.ReactNode;
  /** 旧版侧栏布局：窄屏显示菜单浮动按钮 */
  legacyMobileMenu?: boolean;
}

export const AppMain: React.FC<AppMainProps> = ({
  children,
  legacyMobileMenu = false,
}) => {
  const { t } = useI18n();
  const { isFullscreenMode, toggleMobileSidebar, mobileSidebarOpen } =
    useUIStore();
  const isMobile = useMobileViewport();

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {legacyMobileMenu && isMobile && !isFullscreenMode ? (
        <button
          type="button"
          className="app-main-mobile-menu"
          onClick={toggleMobileSidebar}
          title={t('header.openMenu')}
          aria-label={t('header.openMenu')}
          aria-expanded={mobileSidebarOpen}
        >
          <Menu size={20} aria-hidden />
        </button>
      ) : null}

      <main className="flex-1 overflow-hidden bg-white relative min-h-0">
        {children}
      </main>
    </div>
  );
};
