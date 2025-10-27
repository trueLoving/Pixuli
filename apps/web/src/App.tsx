/**
 * TODO:
 * 1.3.0 web 版本需求：
 *  版本依赖信息完善（补充 git 分支相关信息）
 */
import {
  formatFileSize,
  getImageDimensionsFromUrl,
  GitHubConfigModal,
  ImageBrowser,
  ImageSearch,
  ImageUpload,
  KeyboardHelpModal,
  keyboardManager,
  LanguageSwitcher,
  Toaster,
} from '@packages/ui/src';
import { HelpCircle, Info, RefreshCw, Settings } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { Demo, useDemoMode } from './components/demo/Demo';
import VersionInfoModal from './components/version-info/VersionInfoModal';
import { useI18n } from './i18n/useI18n';
import { useImageStore } from './stores/imageStore';
import { createKeyboardShortcuts } from './utils/keyboardShortcuts';

function App() {
  const { t, changeLanguage, getCurrentLanguage, getAvailableLanguages } =
    useI18n();
  const { isDemoMode, exitDemoMode } = useDemoMode();
  const {
    images,
    loading,
    error,
    githubConfig,
    loadImages,
    clearError,
    setGitHubConfig,
    clearGitHubConfig,
    uploadImage,
    uploadMultipleImages,
    batchUploadProgress,
    deleteImage,
    updateImage,
  } = useImageStore();

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showVersionInfo, setShowVersionInfo] = useState(false);

  // 键盘快捷键分类数据 - 使用 useMemo 优化性能
  const keyboardCategories = useMemo(
    () => [
      {
        name: t('keyboard.categories.general'),
        shortcuts: [
          { description: t('keyboard.shortcuts.closeModal'), key: 'Escape' },
          { description: t('keyboard.shortcuts.showHelp'), key: 'F1' },
          { description: t('keyboard.shortcuts.refresh'), key: 'F5' },
          {
            description: t('keyboard.shortcuts.openConfig'),
            key: ',',
            ctrlKey: true,
          },
          { description: t('keyboard.shortcuts.focusSearch'), key: '/' },
          {
            description: t('keyboard.shortcuts.toggleView'),
            key: 'V',
            ctrlKey: true,
          },
        ],
      },
      {
        name: t('keyboard.categories.browsing'),
        shortcuts: [
          { description: t('keyboard.shortcuts.selectUp'), key: 'ArrowUp' },
          { description: t('keyboard.shortcuts.selectDown'), key: 'ArrowDown' },
          { description: t('keyboard.shortcuts.selectLeft'), key: 'ArrowLeft' },
          {
            description: t('keyboard.shortcuts.selectRight'),
            key: 'ArrowRight',
          },
          { description: t('keyboard.shortcuts.openSelected'), key: 'Enter' },
        ],
      },
    ],
    [t]
  );

  // 使用 useCallback 优化回调函数
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

  const handleUpdateImage = useCallback(
    async (data: any) => {
      await updateImage(data);
    },
    [updateImage]
  );

  const handleOpenKeyboardHelp = useCallback(() => {
    setShowKeyboardHelp(true);
  }, []);

  const handleCloseKeyboardHelp = useCallback(() => {
    setShowKeyboardHelp(false);
  }, []);

  const handleOpenVersionInfo = useCallback(() => {
    setShowVersionInfo(true);
  }, []);

  const handleCloseVersionInfo = useCallback(() => {
    setShowVersionInfo(false);
  }, []);

  // 初始化存储服务
  useEffect(() => {
    if (githubConfig) {
      const { initializeStorage } = useImageStore.getState();
      initializeStorage();
      handleLoadImages();
    }
  }, [githubConfig, handleLoadImages]);

  // 页面加载时初始化
  useEffect(() => {
    const { githubConfig, initializeStorage } = useImageStore.getState();
    if (githubConfig && !useImageStore.getState().storageService) {
      initializeStorage();
    }
  }, []);

  // 注册键盘快捷键 - 使用事件驱动模式
  useEffect(() => {
    const shortcuts = createKeyboardShortcuts(t);
    keyboardManager.registerBatch(shortcuts);

    // 事件监听器
    const handleCloseModals = () => {
      if (showConfigModal) handleCloseConfigModal();
      else if (showKeyboardHelp) handleCloseKeyboardHelp();
    };

    const handleOpenKeyboardHelpEvent = () => handleOpenKeyboardHelp();
    const handleRefreshImages = () => handleLoadImages();
    const handleOpenConfig = () => handleOpenConfigModal();

    window.addEventListener('closeModals', handleCloseModals);
    window.addEventListener('openKeyboardHelp', handleOpenKeyboardHelpEvent);
    window.addEventListener('refreshImages', handleRefreshImages);
    window.addEventListener('openConfig', handleOpenConfig);

    return () => {
      shortcuts.forEach(shortcut => keyboardManager.unregister(shortcut));
      window.removeEventListener('closeModals', handleCloseModals);
      window.removeEventListener(
        'openKeyboardHelp',
        handleOpenKeyboardHelpEvent
      );
      window.removeEventListener('refreshImages', handleRefreshImages);
      window.removeEventListener('openConfig', handleOpenConfig);
    };
  }, [
    t,
    showConfigModal,
    showKeyboardHelp,
    handleCloseConfigModal,
    handleCloseKeyboardHelp,
    handleOpenKeyboardHelp,
    handleLoadImages,
    handleOpenConfigModal,
  ]);

  // 过滤图片 - 使用 useMemo 优化性能
  const filteredImages = useMemo(() => {
    return images.filter(image => {
      const matchesSearch =
        image.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        image.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some(tag => image.tags?.includes(tag));

      return matchesSearch && matchesTags;
    });
  }, [images, searchTerm, selectedTags]);

  // 获取所有标签 - 使用 useMemo 优化性能
  const allTags = useMemo(() => {
    return Array.from(new Set(images.flatMap(img => img.tags || [])));
  }, [images]);

  if (!githubConfig) {
    return (
      <div
        className="h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: 'var(--app-theme-background-primary)' }}
      >
        <div className="text-center w-full max-w-md">
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Settings className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {t('app.welcome')}
          </h1>
          <p className="text-gray-600 mb-8 text-lg">{t('app.subtitle')}</p>

          {isDemoMode && <Demo t={t} onExitDemo={exitDemoMode} />}

          <p className="text-gray-500 mb-6 text-base">{t('app.description')}</p>
          <button
            onClick={handleOpenConfigModal}
            className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 text-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {t('app.configureGitHub')}
          </button>
        </div>

        {/* GitHub 配置模态框 */}
        <GitHubConfigModal
          isOpen={showConfigModal}
          onClose={handleCloseConfigModal}
          githubConfig={githubConfig}
          onSaveConfig={handleSaveConfig}
          onClearConfig={handleClearConfig}
          t={t}
        />
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col"
      style={{ backgroundColor: 'var(--app-theme-background-primary)' }}
    >
      {/* 顶部导航栏 */}
      <header
        className="shadow-sm border-b flex-shrink-0"
        style={{ backgroundColor: 'var(--app-theme-background-secondary)' }}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">
                {t('app.title')}
              </h1>
              <div className="text-sm text-gray-500 hidden sm:block">
                {t('app.repository')}: {githubConfig.owner}/{githubConfig.repo}
              </div>
              {isDemoMode && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  <span>{t('app.demoMode.title')}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <LanguageSwitcher
                currentLanguage={getCurrentLanguage()}
                availableLanguages={getAvailableLanguages()}
                onLanguageChange={changeLanguage}
                switchTitle={t('language.switch')}
                currentTitle={t('language.current')}
                showBackdrop={true}
              />
              <button
                onClick={handleOpenVersionInfo}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                title={t('version.title')}
              >
                <Info className="w-5 h-5" />
              </button>
              <button
                onClick={handleOpenConfigModal}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                title={`${t('navigation.settings')} (Ctrl+,)`}
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleLoadImages}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                title={`${t('navigation.refresh')} (F5)`}
              >
                <RefreshCw
                  className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
                />
              </button>
              <button
                onClick={handleOpenKeyboardHelp}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                title={`${t('navigation.help')} (F1)`}
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 - 可滚动 */}
      <main className="flex-1 overflow-y-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-red-800">{error}</p>
                <button
                  onClick={clearError}
                  className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* 搜索和过滤区域 */}
          <ImageSearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            allTags={allTags}
            t={t}
          />

          {/* 图片上传区域 */}
          <div className="mb-4">
            <ImageUpload
              t={t}
              onUploadImage={uploadImage}
              onUploadMultipleImages={uploadMultipleImages}
              loading={loading}
              batchUploadProgress={batchUploadProgress}
              enableCrop={true}
              cropOptions={{
                aspectRatio: 16 / 9, // 16:9 宽高比，适合大多数场景
                minWidth: 320,
                minHeight: 180,
                maxWidth: 1920,
                maxHeight: 1080,
              }}
            />
          </div>

          {/* 图片统计和操作区域 */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('app.imageLibrary')} ({filteredImages.length} {t('app.images')}
              )
            </h2>
            {loading && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t('app.loadingImages')}</span>
              </div>
            )}
          </div>

          {/* 图片浏览 */}
          <div className="min-h-0">
            <ImageBrowser
              t={t}
              images={filteredImages}
              onDeleteImage={handleDeleteImage}
              onUpdateImage={handleUpdateImage}
              getImageDimensionsFromUrl={getImageDimensionsFromUrl}
              formatFileSize={formatFileSize}
            />
          </div>
        </div>
      </main>

      {/* GitHub 配置模态框 */}
      <GitHubConfigModal
        isOpen={showConfigModal}
        onClose={handleCloseConfigModal}
        githubConfig={githubConfig}
        onSaveConfig={handleSaveConfig}
        onClearConfig={handleClearConfig}
        t={t}
      />

      {/* 键盘快捷键帮助模态框 */}
      <KeyboardHelpModal
        isOpen={showKeyboardHelp}
        onClose={handleCloseKeyboardHelp}
        categories={keyboardCategories}
        t={t}
      />

      {/* 版本信息模态框 */}
      <VersionInfoModal
        isOpen={showVersionInfo}
        onClose={handleCloseVersionInfo}
        t={t}
      />

      <Toaster />
    </div>
  );
}

export default App;
