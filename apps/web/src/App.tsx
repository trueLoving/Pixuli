import {
  createDefaultFilters,
  DemoIcon,
  FullScreenLoading,
  Gallery3D,
  GiteeConfigModal,
  GitHubConfigModal,
  Header,
  Search,
  KeyboardHelpModal,
  LanguageSwitcher,
  PhotoWall,
  RefreshButton,
  Sidebar,
  SlideShowPlayer,
  Toaster,
  UploadButton,
  useDemoMode,
  VersionInfoModal,
  DevTools,
  type FilterOptions,
  type VersionInfo,
} from '@packages/common/src';
import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { ImageContent, PWAInstallPrompt, SourceTypeMenu } from './components';
import {
  useAppInitialization,
  useConfigManagement,
  useImageOperations,
  useKeyboardCategories,
  useKeyboardShortcuts,
  useSelectedSourceSync,
  useSourceManagement,
  useUIState,
} from './hooks';
import { useI18n } from './i18n/useI18n';
import { useImageStore } from './stores/imageStore';
import { useSourceStore } from './stores/sourceStore';
import { performanceService } from './services/performanceService';
// CSS 已整合到 BrowseModeSwitcher 组件中

// 声明全局版本信息
declare const __VERSION_INFO__: VersionInfo;

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
    uploadImage,
    uploadMultipleImages,
    batchUploadProgress,
  } = useImageStore();

  const { sources, selectedSourceId } = useSourceStore();

  // Demo 模式管理
  const { isDemoMode } = useDemoMode();

  // UI 状态管理
  const uiState = useUIState();
  const {
    showConfigModal,
    showSourceTypeMenu,
    editingSourceId,
    setEditingSourceId,
    showKeyboardHelp,
    showVersionInfo,
    browseMode,
    setBrowseMode,
    currentView,
    setCurrentView,
    currentFilter,
    setCurrentFilter,
    searchQuery,
    setSearchQuery,
    sidebarCollapsed,
    setSidebarCollapsed,
    fileModeClass,
    slideModeClass,
    handleOpenConfigModal,
    handleCloseConfigModal,
    handleOpenKeyboardHelp,
    handleCloseKeyboardHelp,
    handleOpenVersionInfo,
    handleCloseVersionInfo,
    handleAddSource,
    handleSelectSourceType,
    handleCloseSourceTypeMenu,
    handleBrowseModeChange,
  } = uiState;

  // 源管理
  const sourceManagement = useSourceManagement();
  const {
    selectedSource,
    sidebarSources,
    handleEditSource,
    handleDeleteSource,
    handleSourceSelect,
  } = sourceManagement;

  // 配置管理
  const { handleSaveConfig, handleClearConfig } = useConfigManagement();

  // 图片操作
  const imageOperations = useImageOperations();
  const { handleDeleteImage, handleDeleteMultipleImages, handleUpdateImage } =
    imageOperations;

  // 筛选条件
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

  // 键盘快捷键分类
  const keyboardCategories = useKeyboardCategories(t);

  // 加载图片
  const handleLoadImages = useCallback(async () => {
    try {
      await loadImages();
    } catch (error) {
      console.error('Failed to load images:', error);
    }
  }, [loadImages]);

  // 保存配置（包装以包含 editingSourceId）
  const handleSaveConfigWithId = useMemo(
    () => (config: any) => {
      handleSaveConfig(config, editingSourceId);
      handleCloseConfigModal();
    },
    [handleSaveConfig, editingSourceId, handleCloseConfigModal],
  );

  // 清除配置（包装以包含 editingSourceId）
  const handleClearConfigWithId = useMemo(
    () => () => {
      handleClearConfig(editingSourceId);
      handleCloseConfigModal();
    },
    [handleClearConfig, editingSourceId, handleCloseConfigModal],
  );

  // 编辑源（包装以设置 editingSourceId）
  const handleEditSourceWithId = useMemo(
    () => (sourceId: string) => {
      const newEditingId = handleEditSource(sourceId);
      if (newEditingId) {
        setEditingSourceId(newEditingId);
        handleOpenConfigModal();
      }
    },
    [handleEditSource, setEditingSourceId, handleOpenConfigModal],
  );

  // 删除源（包装以包含翻译函数）
  const handleDeleteSourceWithT = useMemo(
    () => (sourceId: string) => {
      handleDeleteSource(sourceId, t);
    },
    [handleDeleteSource, t],
  );

  // 同步选中源到配置，并在同步后加载图片
  useSelectedSourceSync(selectedSource, () => {
    // 当配置同步后，如果有真实的仓库源配置，自动加载图片
    // 注意：即使是在 Demo 模式下，如果用户配置了真实的仓库源，也应该加载图片
    // Demo 模式只影响是否显示 Demo 图标和使用 Demo 配置，不应该阻止加载真实配置的图片
    if (sources.length > 0 && selectedSource) {
      handleLoadImages();
    }
  });

  // 应用初始化
  useAppInitialization(isDemoMode, hasConfig, handleLoadImages);

  // 键盘快捷键
  useKeyboardShortcuts(
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
  );

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
        onBrowseModeChange={handleBrowseModeChange}
        currentFilter={currentFilter}
        onFilterChange={setCurrentFilter}
        sources={sidebarSources}
        selectedSourceId={selectedSourceId}
        onSourceSelect={handleSourceSelect}
        onSourceEdit={handleEditSourceWithId}
        onSourceDelete={handleDeleteSourceWithT}
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
              <DemoIcon t={t} isDemoMode={isDemoMode} />
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
          <div className={fileModeClass}>
            <ImageContent
              hasConfig={hasConfig}
              error={error}
              onClearError={clearError}
              images={images}
              loading={loading}
              searchQuery={searchQuery}
              externalFilters={externalFilters}
              onDeleteImage={handleDeleteImage}
              onDeleteMultipleImages={handleDeleteMultipleImages}
              onUpdateImage={handleUpdateImage}
              onOpenConfigModal={handleOpenConfigModal}
              t={t}
            />
          </div>
        </main>
      </div>

      {/* 仓库类型选择菜单 */}
      <SourceTypeMenu
        isOpen={showSourceTypeMenu}
        onClose={handleCloseSourceTypeMenu}
        onSelect={handleSelectSourceType}
        t={t}
      />

      {/* GitHub 配置模态框 */}
      <GitHubConfigModal
        isOpen={showConfigModal && storageType !== 'gitee'}
        onClose={handleCloseConfigModal}
        githubConfig={
          // Demo 模式下不显示配置
          isDemoMode
            ? null
            : editingSourceId && selectedSource?.type === 'github'
              ? {
                  owner: selectedSource.owner,
                  repo: selectedSource.repo,
                  branch: selectedSource.branch,
                  token: selectedSource.token,
                  path: selectedSource.path,
                }
              : githubConfig
        }
        onSaveConfig={handleSaveConfigWithId}
        onClearConfig={handleClearConfigWithId}
        t={t}
      />

      {/* Gitee 配置模态框 */}
      <GiteeConfigModal
        isOpen={showConfigModal && storageType === 'gitee'}
        onClose={handleCloseConfigModal}
        giteeConfig={
          // Demo 模式下不显示配置
          isDemoMode
            ? null
            : editingSourceId && selectedSource?.type === 'gitee'
              ? {
                  owner: selectedSource.owner,
                  repo: selectedSource.repo,
                  branch: selectedSource.branch,
                  token: selectedSource.token,
                  path: selectedSource.path,
                }
              : giteeConfig
        }
        onSaveConfig={handleSaveConfigWithId}
        onClearConfig={handleClearConfigWithId}
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
      <div className={slideModeClass}>
        {browseMode === 'slide' && (
          <SlideShowPlayer
            isOpen={true}
            onClose={() => handleBrowseModeChange('file')}
            images={images}
            t={t}
          />
        )}
      </div>

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

      {/* DevTools 调试工具 - 通过环境变量控制 */}
      {import.meta.env.VITE_ENABLE_DEVTOOLS === 'true' && (
        <DevTools performanceMonitor={performanceService.getMonitor()} t={t} />
      )}

      {/* 全屏 Loading - 数据请求时显示 */}
      <FullScreenLoading
        visible={loading}
        text={loading ? t('app.loadingImages') : undefined}
      />
    </div>
  );
}

export default App;
