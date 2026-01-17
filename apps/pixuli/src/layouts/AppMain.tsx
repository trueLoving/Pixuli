/**
 * 主内容区域组件
 * 包含 Header 和主内容区域
 */

import {
  DemoIcon,
  Header,
  LanguageSwitcher,
  RefreshButton,
  UploadButton,
  useDemoMode,
  type ImageUploadData,
  type MultiImageUploadData,
} from '@packages/common/src';
import React from 'react';
import { useI18n } from '../i18n/useI18n';
import { useImageStore } from '../stores/imageStore';
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
  const { loading, batchUploadProgress } = useImageStore();
  const { isFullscreenMode } = useUIStore();
  const { isDemoMode } = useDemoMode();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 顶部：Header */}
      {!isFullscreenMode && (
        <Header
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
