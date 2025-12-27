import {
  createDefaultFilters,
  DemoIcon,
  FullScreenLoading,
  GiteeConfigModal,
  GitHubConfigModal,
  Header,
  KeyboardHelpModal,
  LanguageSwitcher,
  RefreshButton,
  Sidebar,
  Toaster,
  UploadButton,
  useDemoMode,
  VersionInfoModal,
  filterImages,
  type VersionInfo,
  type SidebarMenuItem,
} from '@packages/common/src';
import type { FilterOptions } from '@packages/common/src/components/image/image-browser/common/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { SourceTypeMenu } from './features';
import {
  useAppInitialization,
  useConfigManagement,
  useKeyboardCategories,
  useKeyboardShortcuts,
  useSelectedSourceSync,
  useSourceManagement,
  useUIState,
} from './hooks';
import { useI18n } from './i18n/useI18n';
import {
  AIAnalysisWindowPage,
  CompressionWindowPage,
  ConversionWindowPage,
  ProjectPage,
} from './pages';
import { CompressPage } from './pages/compress';
import { ConvertPage } from './pages/convert';
import { PhotosPage } from './pages/photos';
import { SlideshowPage } from './pages/slideshow';
import { TimelinePage } from './pages/timeline';
import { useImageStore } from './stores/imageStore';
import { useSourceStore } from './stores/sourceStore';

// 声明全局版本信息
declare const __VERSION_INFO__: VersionInfo;

// Desktop 版本的 App
function DesktopApp() {
  // 检查是否在特殊窗口模式
  const [isCompressionMode] = useState(window.location.hash === '#compression');
  const [isConversionMode] = useState(window.location.hash === '#conversion');
  const [isAIAnalysisMode] = useState(window.location.hash === '#ai-analysis');
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

  // 如果是特殊窗口模式，使用原有逻辑
  if (isAIAnalysisMode) {
    return <AIAnalysisWindowPage />;
  }

  if (isConversionMode) {
    return <ConversionWindowPage />;
  }

  if (isCompressionMode) {
    return <CompressionWindowPage />;
  }

  if (projectSourceId) {
    return <ProjectPage projectSourceId={projectSourceId} />;
  }

  // 主窗口：使用与 web 端相同的界面结构
  return <DesktopMainApp />;
}

// Desktop 主窗口组件（与 Web 端界面一致）
function DesktopMainApp() {
  const { t, changeLanguage, getCurrentLanguage, getAvailableLanguages } =
    useI18n();
  const {
    images,
    loading,
    storageType,
    githubConfig,
    giteeConfig,
    loadImages,
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
    setCurrentView,
    setCurrentUtilityTool,
    searchQuery,
    sidebarCollapsed,
    setSidebarCollapsed,
    fileModeClass,
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
    activeMenu,
    setActiveMenu,
    isFullscreenMode,
    setIsFullscreenMode,
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

  // 筛选条件
  const [externalFilters, setExternalFilters] = useState<FilterOptions>(
    createDefaultFilters(),
  );

  // 同步搜索查询到筛选条件
  useEffect(() => {
    setExternalFilters((prev: FilterOptions) => ({
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
    if (sources.length > 0 && selectedSource) {
      handleLoadImages();
    }
  });

  // 应用初始化
  useAppInitialization(isDemoMode, hasConfig, handleLoadImages);

  // 计算筛选后的图片（用于照片墙、3D画廊和幻灯片模式）
  const filteredImages = useMemo(() => {
    return filterImages(images, externalFilters);
  }, [images, externalFilters]);

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
      {!isFullscreenMode && (
        <Sidebar
          onMenuClick={(menuItem: SidebarMenuItem) => {
            if (menuItem.type === 'browse') {
              handleBrowseModeChange(menuItem.mode);
              if (menuItem.mode === 'file') {
                setActiveMenu('photos');
                setCurrentView('photos');
                setCurrentUtilityTool(null);
              } else {
                setActiveMenu(`browse-${menuItem.mode}`);
                setCurrentView('photos');
                setCurrentUtilityTool(null);
              }
            } else if (menuItem.type === 'utility') {
              setCurrentUtilityTool(menuItem.tool);
              setActiveMenu(menuItem.tool);
              setCurrentView('photos');
              handleBrowseModeChange('file');
            } else if (menuItem.type === 'view') {
              setCurrentView(menuItem.view);
              setActiveMenu(menuItem.view);
              setCurrentUtilityTool(null);
              handleBrowseModeChange('file');
            }
          }}
          activeMenu={activeMenu}
          browseMode={browseMode}
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
      )}

      {/* 右侧：主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部：Header */}
        {!isFullscreenMode && (
          <Header
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
        )}

        {/* 底部：AppMain 主内容区域 */}
        <main className="flex-1 overflow-hidden bg-white relative">
          {/* 根据 activeMenu 切换页面 */}
          {activeMenu === 'compress' && (
            <div className="h-full w-full">
              <CompressPage />
            </div>
          )}
          {activeMenu === 'convert' && (
            <div className="h-full w-full">
              <ConvertPage />
            </div>
          )}
          {activeMenu === 'photos' && browseMode === 'file' && (
            <div className={`h-full ${fileModeClass}`}>
              <PhotosPage />
            </div>
          )}
          {activeMenu === 'browse-slide' && browseMode === 'slide' && (
            <SlideshowPage
              images={filteredImages}
              isFullscreenMode={isFullscreenMode}
              onFullscreenToggle={isFullscreen => {
                setIsFullscreenMode(isFullscreen);
              }}
              onExitFullscreen={() => {
                setIsFullscreenMode(false);
                if (document.exitFullscreen) {
                  document.exitFullscreen();
                }
              }}
            />
          )}
          {activeMenu === 'browse-timeline' && browseMode === 'timeline' && (
            <TimelinePage
              images={filteredImages}
              isFullscreenMode={isFullscreenMode}
              onFullscreenToggle={isFullscreen => {
                setIsFullscreenMode(isFullscreen);
              }}
              onExitFullscreen={() => {
                setIsFullscreenMode(false);
                if (document.exitFullscreen) {
                  document.exitFullscreen();
                }
              }}
            />
          )}
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
        platform="desktop"
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

      <Toaster />

      {/* 全屏 Loading - 数据请求时显示 */}
      <FullScreenLoading
        visible={loading}
        text={loading ? t('app.loadingImages') : undefined}
      />
    </div>
  );
}

DesktopApp.displayName = 'DesktopApp';

export default DesktopApp;
