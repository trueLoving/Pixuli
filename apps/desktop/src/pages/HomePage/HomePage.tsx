import { Toaster } from '@packages/ui/src';
import React, { useCallback, useState } from 'react';
import { useI18n } from '../../i18n/useI18n';
import Header from '../../layouts/Header/Header';
import SourceManager from '../../layouts/SourceManager/SourceManager';
import { useImageStore } from '../../stores/imageStore';

export const HomePage: React.FC = () => {
  const { t, changeLanguage, getCurrentLanguage, getAvailableLanguages } =
    useI18n();
  const {
    storageType,
    githubConfig,
    upyunConfig,
    loading,
    loadImages,
    setGitHubConfig,
    clearGitHubConfig,
    setUpyunConfig,
    clearUpyunConfig,
  } = useImageStore();

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showUpyunConfigModal, setShowUpyunConfigModal] = useState(false);

  const handleLoadImages = useCallback(async () => {
    try {
      await loadImages();
    } catch (error) {
      console.error('Failed to load images:', error);
    }
  }, [loadImages]);

  const handleOpenConfigModal = useCallback(() => {
    setShowConfigModal(true);
  }, []);

  const handleCloseConfigModal = useCallback(() => {
    setShowConfigModal(false);
  }, []);

  const handleOpenUpyunConfigModal = useCallback(() => {
    setShowUpyunConfigModal(true);
  }, []);

  const handleCloseUpyunConfigModal = useCallback(() => {
    setShowUpyunConfigModal(false);
  }, []);

  const handleSaveConfig = useCallback(
    (config: any) => {
      setGitHubConfig(config);
      setShowConfigModal(false);
    },
    [setGitHubConfig]
  );

  const handleClearConfig = useCallback(() => {
    clearGitHubConfig();
    setShowConfigModal(false);
  }, [clearGitHubConfig]);

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <Header
        storageType={storageType}
        githubConfig={githubConfig}
        upyunConfig={upyunConfig}
        loading={loading}
        t={t}
        currentLanguage={getCurrentLanguage()}
        availableLanguages={getAvailableLanguages()}
        onLanguageChange={changeLanguage}
        onLoadImages={handleLoadImages}
        onSaveConfig={handleSaveConfig}
        onClearConfig={handleClearConfig}
        onSetUpyunConfig={setUpyunConfig}
        onClearUpyunConfig={clearUpyunConfig}
        onAnalysisComplete={result => {
          console.log('AI 分析完成:', result);
        }}
        isProjectWindow={false}
      />
      <div className="flex-1 overflow-hidden">
        <SourceManager />
      </div>
      <Toaster />
    </div>
  );
};

export default HomePage;
