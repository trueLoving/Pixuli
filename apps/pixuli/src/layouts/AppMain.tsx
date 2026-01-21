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
  type ImageUploadData,
  type MultiImageUploadData,
} from '@packages/common/src';
import React from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '../router/routes';
import { useSearchContextSafe } from '../contexts/SearchContext';
import { useI18n } from '../i18n/useI18n';
import { useImageStore } from '../stores/imageStore';
import { useSourceStore } from '../stores/sourceStore';
import { useUIStore } from '../stores/uiStore';

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
  const { sources } = useSourceStore();
  const { isFullscreenMode } = useUIStore();
  const { isDemoMode } = useDemoMode();
  const location = useLocation();
  const searchContext = useSearchContextSafe();

  // 判断是否在照片页面，如果是则显示搜索框
  const isPhotosPage = location.pathname === ROUTES.PHOTOS;

  // 构建左侧操作区域（搜索框）
  const leftActions =
    isPhotosPage && searchContext && searchContext.showSearch ? (
      <div className="flex-1 max-w-2xl">
        <Search
          searchQuery={searchContext.searchQuery}
          onSearchChange={searchContext.setSearchQuery}
          variant="header"
          hasConfig={hasConfig}
          images={images}
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
                  loading={loading}
                  batchUploadProgress={batchUploadProgress}
                  t={t}
                />
              )}
              {hasConfig && (
                <RefreshButton
                  onRefresh={onLoadImages}
                  loading={loading}
                  disabled={!hasConfig}
                  t={t}
                />
              )}
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
