/**
 * 主内容区域组件
 * 包含 Header 和主内容区域
 */

import {
  DemoIcon,
  Header,
  LanguageSwitcher,
  RefreshButton,
  Search,
  UploadButton,
  useDemoMode,
} from '@pixuli/ui';
import type { ImageUploadData, MultiImageUploadData } from '@pixuli/core/types';
import { Menu, ScrollText } from 'lucide-react';
import React from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '../router/routes';
import { useSearchContextSafe } from '../contexts/SearchContext';
import { useMobileViewport } from '../hooks/useMobileViewport';
import { useI18n } from '../i18n/useI18n';
import { isDesktopWorkspaceAvailable } from '../platforms/desktop/workspaceAdapter';
import { useImageStore } from '../stores/imageStore';
import { useSourceStore } from '../stores/sourceStore';
import { useUIStore } from '../stores/uiStore';
import { useWorkspaceStore } from '../stores/workspaceStore';

interface AppMainProps {
  children: React.ReactNode;
  hasConfig: boolean;
  onLoadImages: () => Promise<void>;
  onUploadImage: (data: ImageUploadData) => Promise<void>;
  onUploadMultipleImages: (data: MultiImageUploadData) => Promise<void>;
}

export const AppMain: React.FC<AppMainProps> = ({
  children,
  hasConfig,
  onLoadImages,
  onUploadImage,
  onUploadMultipleImages,
}) => {
  const { t, changeLanguage, getCurrentLanguage, getAvailableLanguages } =
    useI18n();
  const { loading, batchUploadProgress, images } = useImageStore();
  const workspaceMode = useWorkspaceStore(state => state.mode);
  const localImages = useWorkspaceStore(state => state.localImages);
  const workspaceLoading = useWorkspaceStore(state => state.loading);
  const localActive =
    isDesktopWorkspaceAvailable() && workspaceMode === 'local';
  const displayLoading = localActive ? workspaceLoading : loading;
  const displayImages = localActive ? localImages : images;
  const { sources } = useSourceStore();
  const {
    isFullscreenMode,
    openOperationLog,
    toggleMobileSidebar,
    mobileSidebarOpen,
  } = useUIStore();
  const { isDemoMode } = useDemoMode();
  const location = useLocation();
  const searchContext = useSearchContextSafe();
  const isMobile = useMobileViewport();

  // 判断是否在照片页面，如果是则显示搜索框
  const isPhotosPage = location.pathname === ROUTES.PHOTOS;

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

  const searchAction =
    isPhotosPage && searchContext && searchContext.showSearch ? (
      <div className="flex-1 min-w-0 max-w-2xl">
        <Search
          searchQuery={searchContext.searchQuery}
          onSearchChange={searchContext.setSearchQuery}
          variant="header"
          hasConfig={hasConfig}
          images={displayImages}
          externalFilters={searchContext.filters}
          onFiltersChange={searchContext.setFilters}
          showFilter={true}
          showHistory={true}
          history={searchContext.history}
          onSelectHistory={searchContext.handleSelectHistory}
          onDeleteHistory={searchContext.handleDeleteHistory}
          onClearHistory={searchContext.handleClearHistory}
          onSaveHistory={searchContext.handleSaveHistory}
          t={t}
        />
      </div>
    ) : null;

  const leftActions =
    mobileMenuButton || searchAction ? (
      <>
        {mobileMenuButton}
        {searchAction}
      </>
    ) : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 顶部：Header */}
      {!isFullscreenMode && (
        <Header
          leftActions={leftActions}
          rightActions={
            <>
              <DemoIcon t={t} isDemoMode={isDemoMode} />
              {hasConfig && (
                <UploadButton
                  onUploadImage={onUploadImage}
                  onUploadMultipleImages={onUploadMultipleImages}
                  loading={displayLoading}
                  batchUploadProgress={batchUploadProgress}
                  t={t}
                />
              )}
              {hasConfig && (
                <RefreshButton
                  onRefresh={onLoadImages}
                  loading={displayLoading}
                  disabled={!hasConfig}
                  t={t}
                />
              )}
              <button
                type="button"
                onClick={openOperationLog}
                title={t('header.operationLog')}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
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
