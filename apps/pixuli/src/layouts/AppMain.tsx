/**
 * 主内容区域组件
 * 包含 Header 和主内容区域
 */

import { Header, LanguageSwitcher } from '@pixuli/ui';
import { Menu, ScrollText } from 'lucide-react';
import React from 'react';
import { useMobileViewport } from '../hooks/useMobileViewport';
import { useI18n } from '../i18n/useI18n';
import { useUIStore } from '../stores/uiStore';

interface AppMainProps {
  children: React.ReactNode;
}

export const AppMain: React.FC<AppMainProps> = ({ children }) => {
  const { t, changeLanguage, getCurrentLanguage, getAvailableLanguages } =
    useI18n();
  const {
    isFullscreenMode,
    openOperationLog,
    toggleMobileSidebar,
    mobileSidebarOpen,
  } = useUIStore();
  const isMobile = useMobileViewport();

  const mobileMenuButton = isMobile ? (
    <button
      type="button"
      className="header-button icon-only mobile-menu-btn"
      onClick={toggleMobileSidebar}
      title={t('header.openMenu')}
      aria-label={t('header.openMenu')}
      aria-expanded={mobileSidebarOpen}
    >
      <Menu size={20} />
    </button>
  ) : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 顶部：Header */}
      {!isFullscreenMode && (
        <Header
          leftActions={mobileMenuButton}
          rightActions={
            <>
              <button
                type="button"
                onClick={openOperationLog}
                title={t('header.operationLog')}
                className="header-button icon-only p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                aria-label={t('header.operationLog')}
              >
                <ScrollText size={18} />
              </button>
              <LanguageSwitcher
                currentLanguage={getCurrentLanguage()}
                availableLanguages={getAvailableLanguages()}
                onLanguageChange={changeLanguage}
                switchTitle={t('language.switch')}
                currentTitle={t('language.current')}
                showBackdrop={true}
              />
            </>
          }
        />
      )}

      {/* 主内容区域 */}
      <main className="flex-1 overflow-hidden bg-white relative">
        {children}
      </main>
    </div>
  );
};
