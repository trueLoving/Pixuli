import {
  BrowseMode,
  EmptyState,
  FullScreenLoading,
  GitHubConfigModal,
  GiteeConfigModal,
  Header,
  Search,
  ImageBrowser,
  KeyboardHelpModal,
  LanguageSwitcher,
  RefreshButton,
  Sidebar,
  SidebarFilter,
  SlideShowPlayer,
  Timeline,
  Toaster,
  UploadButton,
  VersionInfoModal,
  filterImages,
  formatFileSize,
  getImageDimensionsFromUrl,
  type FilterOptions,
  type VersionInfo,
} from '@packages/common/src';
import { createDefaultFilters } from '@packages/common/src/utils/filterUtils';
import { Github, X } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useI18n } from '../../i18n/useI18n';
import { useImageStore } from '../../stores/imageStore';
import { useSourceStore } from '../../stores/sourceStore';
// CSS 已整合到 BrowseModeSwitcher 组件中

// 声明全局版本信息
declare const __VERSION_INFO__: VersionInfo;

export const HomePage: React.FC = () => {
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
    clearGitHubConfig,
    setGiteeConfig,
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
    openProjectWindow,
  } = useSourceStore();

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showSourceTypeMenu, setShowSourceTypeMenu] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showVersionInfo, setShowVersionInfo] = useState(false);
  const [browseMode, setBrowseMode] = useState<BrowseMode>('file');
  const [currentFilter, setCurrentFilter] = useState<SidebarFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [externalFilters, setExternalFilters] = useState<FilterOptions>(
    createDefaultFilters(),
  );

  // 浏览模式切换动画状态
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [fileModeClass, setFileModeClass] = useState(
    'browse-mode-file-container',
  );
  const [slideModeClass, setSlideModeClass] = useState(
    'browse-mode-slide-container',
  );

  // 用于跟踪已同步的源 ID，避免重复同步
  const lastSyncedSourceIdRef = useRef<string | null>(null);
  const isInitialMountRef = useRef(true);

  // 同步搜索查询到筛选条件
  useEffect(() => {
    setExternalFilters(prev => ({
      ...prev,
      searchTerm: searchQuery,
    }));
  }, [searchQuery]);

  // 计算筛选后的图片（用于时间线和幻灯片模式）
  const filteredImages = useMemo(() => {
    return filterImages(images, externalFilters);
  }, [images, externalFilters]);

  // 初始化：如果没有选中源但有源列表，自动选中第一个
  useEffect(() => {
    if (!selectedSourceId && sources.length > 0) {
      setSelectedSourceId(sources[0].id);
    }
  }, [selectedSourceId, sources, setSelectedSourceId]);

  // 监听键盘帮助事件
  useEffect(() => {
    const handleOpenKeyboardHelp = () => {
      setShowKeyboardHelp(true);
    };
    window.addEventListener('openKeyboardHelp', handleOpenKeyboardHelp);
    return () => {
      window.removeEventListener('openKeyboardHelp', handleOpenKeyboardHelp);
    };
  }, []);

  // 监听版本信息事件
  useEffect(() => {
    const handleOpenVersionInfo = () => {
      setShowVersionInfo(true);
    };
    window.addEventListener('openVersionInfo', handleOpenVersionInfo);
    return () => {
      window.removeEventListener('openVersionInfo', handleOpenVersionInfo);
    };
  }, []);

  // 键盘快捷键分类数据
  const keyboardCategories = useMemo(() => {
    return [
      {
        name: t('keyboard.categories.general'),
        shortcuts: [
          { description: t('keyboard.shortcuts.closeModal'), key: 'Escape' },
          { description: t('keyboard.shortcuts.showHelp'), key: 'F1' },
          { description: t('keyboard.shortcuts.refresh'), key: 'F5' },
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
    ];
  }, [t]);

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

  const handleLoadImages = useCallback(async () => {
    try {
      await loadImages();
    } catch (error) {
      console.error('Failed to load images:', error);
    }
  }, [loadImages]);

  // 同步选中源到配置，并在同步后加载图片
  useEffect(() => {
    if (selectedSource && sources.length > 0) {
      // 避免重复同步同一个源（但首次加载时允许同步）
      if (
        lastSyncedSourceIdRef.current === selectedSource.id &&
        !isInitialMountRef.current
      ) {
        return;
      }

      // 同步配置到 store
      if (selectedSource.type === 'github') {
        setGitHubConfig({
          owner: selectedSource.owner,
          repo: selectedSource.repo,
          branch: selectedSource.branch,
          token: selectedSource.token,
          path: selectedSource.path,
        } as any);
        useImageStore.setState({ storageType: 'github' });
      } else {
        setGiteeConfig({
          owner: selectedSource.owner,
          repo: selectedSource.repo,
          branch: selectedSource.branch,
          token: selectedSource.token,
          path: selectedSource.path,
        } as any);
        useImageStore.setState({ storageType: 'gitee' });
      }

      // 标记已同步
      lastSyncedSourceIdRef.current = selectedSource.id;
      isInitialMountRef.current = false;

      // 初始化存储服务并加载图片
      setTimeout(() => {
        const { storageService, initializeStorage } = useImageStore.getState();
        if (!storageService) {
          initializeStorage();
        }
        handleLoadImages();
      }, 100);
    }
  }, [
    selectedSource,
    sources.length,
    setGitHubConfig,
    setGiteeConfig,
    handleLoadImages,
  ]);

  const handleAddSource = useCallback(() => {
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

  const handleSaveConfig = useCallback(
    (config: any) => {
      if (editingSourceId) {
        updateSource(editingSourceId, {
          ...config,
          name: `${config.owner}/${config.repo}`,
        });
      } else {
        const newSource = addSource({
          type: storageType || 'github',
          ...config,
          name: `${config.owner}/${config.repo}`,
        });
        setSelectedSourceId(newSource.id);
      }
      setShowConfigModal(false);
      setEditingSourceId(null);
    },
    [
      editingSourceId,
      addSource,
      updateSource,
      setSelectedSourceId,
      storageType,
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

  const handleSourceSelect = useCallback(
    (id: string) => {
      const source = sources.find(s => s.id === id);
      if (source) {
        setSelectedSourceId(id);
        if (source.type === 'github') {
          setGitHubConfig({
            owner: source.owner,
            repo: source.repo,
            branch: source.branch,
            token: source.token,
            path: source.path,
          } as any);
        } else {
          setGiteeConfig({
            owner: source.owner,
            repo: source.repo,
            branch: source.branch,
            token: source.token,
            path: source.path,
          } as any);
        }
        useImageStore.getState().initializeStorage();
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

  const handleEditSource = useCallback(
    (sourceId: string) => {
      const source = sources.find(s => s.id === sourceId);
      if (source) {
        setEditingSourceId(sourceId);
        useImageStore.setState({ storageType: source.type });
        if (source.type === 'github') {
          setGitHubConfig({
            owner: source.owner,
            repo: source.repo,
            branch: source.branch,
            token: source.token,
            path: source.path,
          } as any);
        } else {
          setGiteeConfig({
            owner: source.owner,
            repo: source.repo,
            branch: source.branch,
            token: source.token,
            path: source.path,
          } as any);
        }
        setShowConfigModal(true);
      }
    },
    [sources, setGitHubConfig, setGiteeConfig],
  );

  const handleDeleteSource = useCallback(
    (sourceId: string) => {
      if (window.confirm(t('sidebar.confirmDeleteSource'))) {
        removeSource(sourceId);
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
        await handleLoadImages();
      } catch (error) {
        console.error('Failed to update image:', error);
      }
    },
    [updateImage, handleLoadImages],
  );

  // 处理浏览模式切换（带动画）
  const handleBrowseModeChange = useCallback(
    (newMode: BrowseMode) => {
      if (newMode === browseMode || isTransitioning) return;

      setIsTransitioning(true);

      // 文件模式 -> 幻灯片模式
      if (browseMode === 'file' && newMode === 'slide') {
        // 先淡出文件模式
        setFileModeClass('browse-mode-file-container fade-out');
        // 300ms 后切换模式并淡入幻灯片
        setTimeout(() => {
          setBrowseMode('slide');
          setSlideModeClass('browse-mode-slide-container fade-in');
          setTimeout(() => {
            setIsTransitioning(false);
            setFileModeClass('browse-mode-file-container');
          }, 300);
        }, 300);
      }
      // 幻灯片模式 -> 文件模式
      else if (browseMode === 'slide' && newMode === 'file') {
        // 先淡出幻灯片
        setSlideModeClass('browse-mode-slide-container fade-out');
        // 300ms 后切换模式并淡入文件
        setTimeout(() => {
          setBrowseMode('file');
          setFileModeClass('browse-mode-file-container fade-in');
          setTimeout(() => {
            setIsTransitioning(false);
            setSlideModeClass('browse-mode-slide-container');
            setFileModeClass('browse-mode-file-container');
          }, 300);
        }, 300);
      }
      // 时间线模式切换（无动画，直接切换）
      else if (newMode === 'timeline') {
        setBrowseMode('timeline');
        setIsTransitioning(false);
      }
      // 其他模式切换（无动画，直接切换）
      else {
        setBrowseMode(newMode);
        setIsTransitioning(false);
      }
    },
    [browseMode, isTransitioning],
  );

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* 左侧：Sidebar */}
      <Sidebar
        browseMode={browseMode}
        onBrowseModeChange={handleBrowseModeChange}
        currentFilter={currentFilter}
        onFilterChange={setCurrentFilter}
        sources={sidebarSources}
        selectedSourceId={selectedSourceId}
        onSourceSelect={handleSourceSelect}
        onSourceEdit={handleEditSource}
        onSourceDelete={handleDeleteSource}
        onSourceOpenInWindow={openProjectWindow}
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
          leftActions={
            <Search
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              variant="header"
              hasConfig={hasConfig}
              images={images}
              externalFilters={externalFilters}
              onFiltersChange={setExternalFilters}
              showFilter={true}
              t={t}
            />
          }
          rightActions={
            <>
              {hasConfig && (
                <UploadButton
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
                  t={t}
                />
              )}
              {hasConfig && (
                <RefreshButton
                  onRefresh={handleLoadImages}
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

        {/* 底部：图片浏览区 */}
        <main className="flex-1 overflow-y-auto bg-white">
          {!hasConfig ? (
            // 未配置：显示引导界面
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
          ) : (
            // 已配置：显示正常内容
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

              {/* 图片浏览 */}
              <div className={`min-h-0 ${fileModeClass}`}>
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

      {/* 全屏 Loading */}
      <FullScreenLoading visible={loading} text={t('app.loadingImages')} />

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
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <Github size={24} className="text-gray-700" />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {t('sidebar.githubDescription')}
                    </div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleSelectSourceType('gitee')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 text-center text-xs font-bold text-[#c73e1d]">
                    码
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {t('sidebar.giteeDescription')}
                    </div>
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
          setShowConfigModal(false);
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
          setShowConfigModal(false);
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
        t={t}
      />

      {/* 键盘帮助模态框 */}
      <KeyboardHelpModal
        t={t}
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
        categories={keyboardCategories}
      />

      {/* 版本信息模态框 */}
      <VersionInfoModal
        t={t}
        isOpen={showVersionInfo}
        onClose={() => setShowVersionInfo(false)}
        versionInfo={__VERSION_INFO__}
      />

      {/* 幻灯片播放器 */}
      <div className={slideModeClass}>
        {browseMode === 'slide' && (
          <SlideShowPlayer
            isOpen={true}
            onClose={() => handleBrowseModeChange('file')}
            images={filteredImages}
            t={t}
          />
        )}
      </div>

      {/* 时间线模式 - 全屏 */}
      {browseMode === 'timeline' && (
        <Timeline
          images={filteredImages}
          t={t}
          onClose={() => handleBrowseModeChange('file')}
        />
      )}

      <Toaster />
    </div>
  );
};

export default HomePage;
