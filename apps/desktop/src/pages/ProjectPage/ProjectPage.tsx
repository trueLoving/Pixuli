import { Toaster } from '@packages/ui/src';
import React, { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../../i18n/useI18n';
import Header from '../../layouts/Header/Header';
import Main from '../../layouts/Main/Main';
import { useImageStore } from '../../stores/imageStore';
import { useSourceStore } from '../../stores/sourceStore';

export const ProjectPage: React.FC = () => {
  const { t, changeLanguage, getCurrentLanguage, getAvailableLanguages } =
    useI18n();
  const sourceStore = useSourceStore();
  const {
    images,
    loading,
    error,
    githubConfig,
    upyunConfig,
    storageType,
    batchUploadProgress,
    loadImages,
    clearError,
    setGitHubConfig,
    clearGitHubConfig,
    setUpyunConfig,
    clearUpyunConfig,
    uploadImage,
    uploadMultipleImages,
    deleteImage,
    deleteMultipleImages,
    updateImage,
  } = useImageStore();

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showUpyunConfigModal, setShowUpyunConfigModal] = useState(false);

  // 项目窗口判断与参数解析
  const [projectSourceId] = useState<string | null>(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#project')) {
      const idx = hash.indexOf('?');
      const query = idx >= 0 ? new URLSearchParams(hash.slice(idx + 1)) : null;
      const id = query?.get('id');
      return id || null;
    }
    return null;
  });

  // 使用 useCallback 来稳定函数引用
  const handleLoadImages = useCallback(async () => {
    try {
      await loadImages();
    } catch (error) {
      console.error('Failed to load images:', error);
    }
  }, [loadImages]);

  // 根据 projectSourceId 设置 GitHub 配置
  useEffect(() => {
    if (!projectSourceId) return;
    const src = sourceStore.getSourceById(projectSourceId);
    if (src && src.type === 'github') {
      setGitHubConfig({
        owner: src.owner,
        repo: src.repo,
        branch: src.branch,
        token: src.token,
        path: src.path,
      } as any);
    } else if (src && src.type === 'upyun') {
      setUpyunConfig({
        operator: src.operator,
        password: src.password,
        bucket: src.bucket,
        domain: src.domain,
        path: src.path,
      });
    }
  }, [projectSourceId, sourceStore, setGitHubConfig, setUpyunConfig]);

  // 初始化存储服务
  useEffect(() => {
    if (!projectSourceId) return;
    if (
      useImageStore.getState().githubConfig ||
      useImageStore.getState().upyunConfig
    ) {
      const { initializeStorage } = useImageStore.getState();
      initializeStorage();
      handleLoadImages();
    }
  }, [projectSourceId, handleLoadImages]);

  // 页面加载时初始化
  useEffect(() => {
    if (!projectSourceId) return;
    const { githubConfig, upyunConfig, initializeStorage } =
      useImageStore.getState();
    if (
      (githubConfig || upyunConfig) &&
      !useImageStore.getState().storageService
    ) {
      initializeStorage();
    }
  }, [projectSourceId]);

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

  const handleDeleteImage = useCallback(
    async (imageId: string, fileName: string) => {
      await deleteImage(imageId, fileName);
    },
    [deleteImage]
  );

  const handleDeleteMultipleImages = useCallback(
    async (imageIds: string[], fileNames: string[]) => {
      await deleteMultipleImages(imageIds, fileNames);
    },
    [deleteMultipleImages]
  );

  const handleUpdateImage = useCallback(
    async (data: any) => {
      await updateImage(data);
    },
    [updateImage]
  );

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
        isProjectWindow={true}
      />

      <div className="flex-1 overflow-hidden">
        <Main
          t={t}
          error={error}
          onClearError={clearError}
          onUploadImage={uploadImage}
          onUploadMultipleImages={uploadMultipleImages}
          loading={loading}
          batchUploadProgress={batchUploadProgress}
          images={images}
          onDeleteImage={handleDeleteImage}
          onDeleteMultipleImages={handleDeleteMultipleImages}
          onUpdateImage={handleUpdateImage}
        />
      </div>

      <Toaster />
    </div>
  );
};

export default ProjectPage;
