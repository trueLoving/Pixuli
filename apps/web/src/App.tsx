import {
  BrowseMode,
  EmptyState,
  formatFileSize,
  FullScreenLoading,
  Gallery3D,
  getImageDimensionsFromUrl,
  GitHubConfigModal,
  GiteeConfigModal,
  Header,
  ImageBrowser,
  ImageUpload,
  KeyboardHelpModal,
  keyboardManager,
  PhotoWall,
  Sidebar,
  SidebarFilter,
  SidebarView,
  SlideShowPlayer,
  Toaster,
  VersionInfoModal,
  type VersionInfo,
} from '@packages/common/src';
import type { FilterOptions } from '@packages/common/src/components/image-browser/image-filter/ImageFilter';
import { createDefaultFilters } from '@packages/common/src/utils/filterUtils';
import { Github, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';

// 声明全局版本信息
declare const __VERSION_INFO__: VersionInfo;
import { Demo, useDemoMode } from './components/index';
import { PWAInstallPrompt } from './components/pwa';
import { useI18n } from './i18n/useI18n';
import { useImageStore } from './stores/imageStore';
import { useSourceStore } from './stores/sourceStore';
import { createKeyboardShortcuts } from './utils/keyboardShortcuts';
import {
  getDemoGitHubConfig,
  getDemoGiteeConfig,
} from '@packages/common/src/components/demo/Demo';

function App() {
  const { t, changeLanguage, getCurrentLanguage, getAvailableLanguages } =
    useI18n();
  const {
    images,
    loading,
    error,
    storageType,
    githubConfig,
    giteeConfig,
    loadImages,
    clearError,
    setGitHubConfig,
    setGiteeConfig,
    clearGitHubConfig,
    clearGiteeConfig,
    uploadImage,
    uploadMultipleImages,
    batchUploadProgress,
    deleteImage,
    deleteMultipleImages,
    updateImage,
  } = useImageStore();

  const {
    sources,
    selectedSourceId,
    addSource,
    updateSource,
    removeSource,
    setSelectedSourceId,
  } = useSourceStore();

  // Demo 模式管理
  const { isDemoMode, exitDemoMode } = useDemoMode();

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showSourceTypeMenu, setShowSourceTypeMenu] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showVersionInfo, setShowVersionInfo] = useState(false);
  const [browseMode, setBrowseMode] = useState<BrowseMode>('file');
  const [currentView, setCurrentView] = useState<SidebarView>('photos');
  const [currentFilter, setCurrentFilter] = useState<SidebarFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [externalFilters, setExternalFilters] = useState<FilterOptions>(
    createDefaultFilters(),
  );

  // 同步搜索查询到筛选条件
  useEffect(() => {
    setExternalFilters(prev => ({
      ...prev,
      searchTerm: searchQuery,
    }));
  }, [searchQuery]);

  // 判断是否有配置
  const hasConfig = sources.length > 0;

  // 获取当前选中的源
  const selectedSource = useMemo(() => {
    return selectedSourceId
      ? sources.find(s => s.id === selectedSourceId)
      : sources[0] || null;
  }, [sources, selectedSourceId]);

  // 构建仓库源列表（用于侧边栏）
  const sidebarSources = useMemo(() => {
    return sources.map(source => ({
      id: source.id,
      name: source.name || `${source.owner}/${source.repo}`,
      type: source.type,
      owner: source.owner,
      repo: source.repo,
      path: source.path,
      active: selectedSourceId === source.id,
    }));
  }, [sources, selectedSourceId]);

  // 键盘快捷键分类数据
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
    [t],
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
      if (editingSourceId) {
        // 编辑现有源
        updateSource(editingSourceId, {
          ...config,
          name: config.name || `${config.owner}/${config.repo}`,
        });
      } else {
        // 添加新源
        const newSource = addSource({
          type: storageType!,
          name: `${config.owner}/${config.repo}`,
          ...config,
        });
        setSelectedSourceId(newSource.id);
      }
      setShowConfigModal(false);
      setEditingSourceId(null);

      // 切换到保存的源并加载图片
      const sourceConfig = {
        owner: config.owner,
        repo: config.repo,
        branch: config.branch,
        token: config.token,
        path: config.path,
      };

      if (storageType === 'github') {
        setGitHubConfig(sourceConfig);
      } else {
        setGiteeConfig(sourceConfig);
      }

      // 延迟加载，确保配置已更新
      setTimeout(() => {
        handleLoadImages();
      }, 100);
    },
    [
      editingSourceId,
      storageType,
      addSource,
      updateSource,
      setSelectedSourceId,
      setGitHubConfig,
      setGiteeConfig,
      handleLoadImages,
    ],
  );

  const handleClearConfig = useCallback(() => {
    if (editingSourceId) {
      removeSource(editingSourceId);
      setSelectedSourceId(null);
    }
    setShowConfigModal(false);
    setEditingSourceId(null);
  }, [editingSourceId, removeSource, setSelectedSourceId]);

  // 处理编辑仓库源
  const handleEditSource = useCallback(
    (sourceId: string) => {
      const source = sources.find(s => s.id === sourceId);
      if (source) {
        setEditingSourceId(sourceId);
        // 设置存储类型
        useImageStore.setState({ storageType: source.type });
        // 设置配置
        if (source.type === 'github') {
          setGitHubConfig({
            owner: source.owner,
            repo: source.repo,
            branch: source.branch,
            token: source.token,
            path: source.path,
          });
        } else {
          setGiteeConfig({
            owner: source.owner,
            repo: source.repo,
            branch: source.branch,
            token: source.token,
            path: source.path,
          });
        }
        // 打开配置模态框
        setShowConfigModal(true);
      }
    },
    [sources, setGitHubConfig, setGiteeConfig],
  );

  // 处理删除仓库源
  const handleDeleteSource = useCallback(
    (sourceId: string) => {
      // 确认删除
      if (window.confirm(t('sidebar.confirmDeleteSource'))) {
        removeSource(sourceId);
        // 如果删除的是当前选中的源，清除选中状态
        if (selectedSourceId === sourceId) {
          setSelectedSourceId(null);
        }
      }
    },
    [removeSource, selectedSourceId, setSelectedSourceId, t],
  );

  const handleDeleteImage = useCallback(
    async (imageId: string, fileName: string) => {
      try {
        await deleteImage(imageId, fileName);
        // 删除后重新加载图片列表
        await handleLoadImages();
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    },
    [deleteImage, handleLoadImages],
  );

  const handleDeleteMultipleImages = useCallback(
    async (imageIds: string[], fileNames: string[]) => {
      try {
        await deleteMultipleImages(imageIds, fileNames);
        // 删除后重新加载图片列表
        await handleLoadImages();
      } catch (error) {
        console.error('Failed to delete multiple images:', error);
      }
    },
    [deleteMultipleImages, handleLoadImages],
  );

  const handleUpdateImage = useCallback(
    async (data: any) => {
      try {
        await updateImage(data);
        // 更新后重新加载图片列表
        await handleLoadImages();
      } catch (error) {
        console.error('Failed to update image:', error);
      }
    },
    [updateImage, handleLoadImages],
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

  const handleAddSource = useCallback(() => {
    // 显示仓库类型选择菜单
    setShowSourceTypeMenu(true);
  }, []);

  const handleSelectSourceType = useCallback((type: 'github' | 'gitee') => {
    setEditingSourceId(null);
    useImageStore.setState({ storageType: type });
    setShowSourceTypeMenu(false);
    setShowConfigModal(true);
  }, []);

  const handleCloseSourceTypeMenu = useCallback(() => {
    setShowSourceTypeMenu(false);
  }, []);

  const handleSourceSelect = useCallback(
    (id: string) => {
      const source = sources.find(s => s.id === id);
      if (source) {
        setSelectedSourceId(id);
        const sourceConfig =
          source.type === 'github'
            ? {
                owner: source.owner,
                repo: source.repo,
                branch: source.branch,
                token: source.token,
                path: source.path,
              }
            : {
                owner: source.owner,
                repo: source.repo,
                branch: source.branch,
                token: source.token,
                path: source.path,
              };
        if (source.type === 'github') {
          setGitHubConfig(sourceConfig);
        } else {
          setGiteeConfig(sourceConfig);
        }
        handleLoadImages();
      }
    },
    [
      sources,
      setSelectedSourceId,
      setGitHubConfig,
      setGiteeConfig,
      handleLoadImages,
    ],
  );

  // 初始化：如果没有选中源但有源列表，自动选中第一个
  useEffect(() => {
    if (!selectedSourceId && sources.length > 0) {
      setSelectedSourceId(sources[0].id);
    }
  }, [selectedSourceId, sources, setSelectedSourceId]);

  // 初始化：如果有选中的源，自动加载配置
  useEffect(() => {
    if (selectedSource) {
      const sourceConfig = {
        owner: selectedSource.owner,
        repo: selectedSource.repo,
        branch: selectedSource.branch,
        token: selectedSource.token,
        path: selectedSource.path,
      };
      if (selectedSource.type === 'github') {
        setGitHubConfig(sourceConfig);
        useImageStore.setState({ storageType: 'github' });
      } else {
        setGiteeConfig(sourceConfig);
        useImageStore.setState({ storageType: 'gitee' });
      }
    }
  }, [selectedSource, setGitHubConfig, setGiteeConfig]);

  // Demo 模式：自动加载 Demo 配置
  useEffect(() => {
    if (isDemoMode && !hasConfig && !githubConfig && !giteeConfig) {
      // 优先使用 GitHub Demo 配置
      const demoGitHubConfig = getDemoGitHubConfig();
      if (
        demoGitHubConfig.config.owner &&
        demoGitHubConfig.config.repo &&
        demoGitHubConfig.config.token
      ) {
        setGitHubConfig(demoGitHubConfig.config);
        useImageStore.setState({ storageType: 'github' });
        return;
      }

      // 如果没有 GitHub 配置，尝试使用 Gitee Demo 配置
      const demoGiteeConfig = getDemoGiteeConfig();
      if (
        demoGiteeConfig.config.owner &&
        demoGiteeConfig.config.repo &&
        demoGiteeConfig.config.token
      ) {
        setGiteeConfig(demoGiteeConfig.config);
        useImageStore.setState({ storageType: 'gitee' });
      }
    }
  }, [
    isDemoMode,
    hasConfig,
    githubConfig,
    giteeConfig,
    setGitHubConfig,
    setGiteeConfig,
  ]);

  // 初始化存储服务
  useEffect(() => {
    const { storageType, githubConfig, giteeConfig, initializeStorage } =
      useImageStore.getState();
    if (
      (storageType === 'github' && githubConfig) ||
      (storageType === 'gitee' && giteeConfig)
    ) {
      initializeStorage();
      handleLoadImages();
    }
  }, [storageType, githubConfig, giteeConfig, handleLoadImages]);

  // 退出 Demo 模式时的处理
  const handleExitDemo = useCallback(() => {
    // 清除所有配置
    clearGitHubConfig();
    clearGiteeConfig();
    useImageStore.setState({ storageType: null, images: [] });
    exitDemoMode();
  }, [clearGitHubConfig, clearGiteeConfig, exitDemoMode]);

  // 页面加载时初始化
  useEffect(() => {
    const {
      storageType,
      githubConfig,
      giteeConfig,
      storageService,
      initializeStorage,
    } = useImageStore.getState();
    if (
      !storageService &&
      ((storageType === 'github' && githubConfig) ||
        (storageType === 'gitee' && giteeConfig))
    ) {
      initializeStorage();
    }
  }, []);

  // 注册键盘快捷键
  useEffect(() => {
    const shortcuts = createKeyboardShortcuts(t);
    keyboardManager.registerBatch(shortcuts);

    const handleCloseModals = () => {
      if (showConfigModal) handleCloseConfigModal();
      else if (showKeyboardHelp) handleCloseKeyboardHelp();
      else if (showVersionInfo) handleCloseVersionInfo();
    };

    const handleOpenKeyboardHelpEvent = () => handleOpenKeyboardHelp();
    const handleOpenVersionInfoEvent = () => handleOpenVersionInfo();
    const handleRefreshImages = () => handleLoadImages();
    const handleOpenConfig = () => handleOpenConfigModal();

    window.addEventListener('closeModals', handleCloseModals);
    window.addEventListener('openKeyboardHelp', handleOpenKeyboardHelpEvent);
    window.addEventListener('openVersionInfo', handleOpenVersionInfoEvent);
    window.addEventListener('refreshImages', handleRefreshImages);
    window.addEventListener('openConfig', handleOpenConfig);

    return () => {
      shortcuts.forEach(shortcut => keyboardManager.unregister(shortcut));
      window.removeEventListener('closeModals', handleCloseModals);
      window.removeEventListener(
        'openKeyboardHelp',
        handleOpenKeyboardHelpEvent,
      );
      window.removeEventListener('openVersionInfo', handleOpenVersionInfoEvent);
      window.removeEventListener('refreshImages', handleRefreshImages);
      window.removeEventListener('openConfig', handleOpenConfig);
    };
  }, [
    t,
    showConfigModal,
    showKeyboardHelp,
    showVersionInfo,
    handleCloseConfigModal,
    handleOpenKeyboardHelp,
    handleOpenVersionInfo,
    handleCloseKeyboardHelp,
    handleCloseVersionInfo,
    handleLoadImages,
    handleOpenConfigModal,
  ]);

  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{
        backgroundColor: 'var(--app-theme-background-primary, #ffffff)',
      }}
    >
      {/* 左侧：侧边栏菜单 */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        browseMode={browseMode}
        onBrowseModeChange={setBrowseMode}
        currentFilter={currentFilter}
        onFilterChange={setCurrentFilter}
        sources={sidebarSources}
        selectedSourceId={selectedSourceId}
        onSourceSelect={handleSourceSelect}
        onSourceEdit={handleEditSource}
        onSourceDelete={handleDeleteSource}
        hasConfig={hasConfig}
        onAddSource={handleAddSource}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        t={t}
      />

      {/* 右侧：主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部：Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          hasConfig={hasConfig}
          onRefresh={handleLoadImages}
          loading={loading}
          onSettings={handleOpenConfigModal}
          currentLanguage={getCurrentLanguage()}
          availableLanguages={getAvailableLanguages()}
          onLanguageChange={changeLanguage}
          t={t}
          images={images}
          externalFilters={externalFilters}
          onFiltersChange={setExternalFilters}
          showFilter={true}
        />

        {/* 底部：图片浏览区 */}
        <main className="flex-1 overflow-y-auto bg-white">
          {!hasConfig ? (
            // 未配置：显示引导界面
            <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
              {/* Demo 模式提示 */}
              {isDemoMode && <Demo t={t} onExitDemo={handleExitDemo} />}
              <EmptyState
                onAddGitHub={() => {
                  useImageStore.setState({ storageType: 'github' });
                  setShowConfigModal(true);
                }}
                onAddGitee={() => {
                  useImageStore.setState({ storageType: 'gitee' });
                  setShowConfigModal(true);
                }}
                t={t}
              />
            </div>
          ) : (
            // 已配置：显示正常内容
            <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
              {/* 错误提示 */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-red-800">
                      {error.includes('|')
                        ? (() => {
                            const [key, provider] = error.split('|');
                            return t(key, { provider });
                          })()
                        : error.startsWith('errors.')
                          ? t(error)
                          : error}
                    </p>
                    <button
                      onClick={clearError}
                      className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* 图片上传区域 */}
              <div className="mb-4">
                <ImageUpload
                  t={t}
                  onUploadImage={uploadImage}
                  onUploadMultipleImages={uploadMultipleImages}
                  loading={loading}
                  batchUploadProgress={batchUploadProgress}
                  enableCompression={true}
                  compressionOptions={{
                    quality: 0.8,
                    maxWidth: 1920,
                    maxHeight: 1080,
                    maintainAspectRatio: true,
                    outputFormat: 'image/jpeg',
                    minSizeToCompress: 100 * 1024,
                  }}
                />
              </div>

              {/* 图片统计和操作区域 */}
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('app.imageLibrary')} ({images.length} {t('app.images')})
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
                {browseMode === 'file' && (
                  <ImageBrowser
                    t={t}
                    images={images}
                    onDeleteImage={handleDeleteImage}
                    onDeleteMultipleImages={handleDeleteMultipleImages}
                    onUpdateImage={handleUpdateImage}
                    getImageDimensionsFromUrl={getImageDimensionsFromUrl}
                    formatFileSize={formatFileSize}
                    externalSearchQuery={searchQuery}
                    externalFilters={externalFilters}
                    hideFilter={true}
                  />
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 仓库类型选择菜单 */}
      {showSourceTypeMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('sidebar.selectSourceType')}
              </h3>
              <button
                onClick={handleCloseSourceTypeMenu}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <button
                onClick={() => handleSelectSourceType('github')}
                className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                  <Github size={24} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900">GitHub</div>
                  <div className="text-sm text-gray-500">
                    {t('sidebar.githubDescription')}
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleSelectSourceType('gitee')}
                className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all group"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center group-hover:bg-red-700 transition-colors">
                  <span className="text-white font-bold text-sm">码</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900">Gitee</div>
                  <div className="text-sm text-gray-500">
                    {t('sidebar.giteeDescription')}
                  </div>
                </div>
              </button>
            </div>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleCloseSourceTypeMenu}
                className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GitHub 配置模态框 */}
      <GitHubConfigModal
        isOpen={showConfigModal && storageType !== 'gitee'}
        onClose={() => {
          handleCloseConfigModal();
          setEditingSourceId(null);
        }}
        githubConfig={
          editingSourceId && selectedSource?.type === 'github'
            ? {
                owner: selectedSource.owner,
                repo: selectedSource.repo,
                branch: selectedSource.branch,
                token: selectedSource.token,
                path: selectedSource.path,
              }
            : githubConfig
        }
        onSaveConfig={handleSaveConfig}
        onClearConfig={handleClearConfig}
        t={t}
      />

      {/* Gitee 配置模态框 */}
      <GiteeConfigModal
        isOpen={showConfigModal && storageType === 'gitee'}
        onClose={() => {
          handleCloseConfigModal();
          setEditingSourceId(null);
        }}
        giteeConfig={
          editingSourceId && selectedSource?.type === 'gitee'
            ? {
                owner: selectedSource.owner,
                repo: selectedSource.repo,
                branch: selectedSource.branch,
                token: selectedSource.token,
                path: selectedSource.path,
              }
            : giteeConfig
        }
        onSaveConfig={handleSaveConfig}
        onClearConfig={handleClearConfig}
        platform="web"
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
        versionInfo={__VERSION_INFO__}
      />

      {/* 幻灯片播放器 */}
      {browseMode === 'slide' && (
        <SlideShowPlayer
          isOpen={true}
          onClose={() => setBrowseMode('file')}
          images={images}
          t={t}
        />
      )}

      {/* 照片墙模式 - 全屏 */}
      {browseMode === 'wall' && (
        <PhotoWall
          images={images}
          t={t}
          onClose={() => setBrowseMode('file')}
        />
      )}

      {/* 3D画廊模式 - 全屏 */}
      {browseMode === 'gallery3d' && (
        <Gallery3D
          images={images}
          t={t}
          onClose={() => setBrowseMode('file')}
        />
      )}

      <Toaster />

      {/* PWA 功能组件 */}
      <PWAInstallPrompt />

      {/* 全屏 Loading - 数据请求时显示 */}
      <FullScreenLoading
        visible={loading}
        text={loading ? t('app.loadingImages') : undefined}
      />
    </div>
  );
}

export default App;
