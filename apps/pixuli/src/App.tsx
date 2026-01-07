import {
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
  type VersionInfo,
  type SidebarMenuItem,
} from '@packages/common/src';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  Suspense,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { ProjectPage } from './platforms/desktop/pages';
import { AppRoutes, ROUTES } from './routes';
import { useImageStore } from './stores/imageStore';
import { useSourceStore } from './stores/sourceStore';
import { isWeb, getPlatform } from './utils/platform';

// 动态导入 Web 平台特定组件（代码分割）
const PWAInstallPrompt = React.lazy(() =>
  import('./features').then(module => ({ default: module.PWAInstallPrompt })),
);

// 声明全局版本信息
declare const __VERSION_INFO__: VersionInfo;

// 主应用组件（统一 Web 和 Desktop）
function App() {
  const navigate = useNavigate();
  const location = useLocation();
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

  // 根据路由路径同步 activeMenu 和 browseMode
  useEffect(() => {
    const path = location.pathname;
    if (path === ROUTES.PHOTOS) {
      setActiveMenu('photos');
      handleBrowseModeChange('file');
    } else if (path === ROUTES.SLIDESHOW) {
      setActiveMenu('browse-slide');
      handleBrowseModeChange('slide');
    } else if (path === ROUTES.TIMELINE) {
      setActiveMenu('browse-timeline');
      handleBrowseModeChange('timeline');
    } else if (path === ROUTES.COMPRESS) {
      setActiveMenu('compress');
      handleBrowseModeChange('file');
    } else if (path === ROUTES.CONVERT) {
      setActiveMenu('convert');
      handleBrowseModeChange('file');
    } else if (path === ROUTES.ANALYZE) {
      setActiveMenu('analyze');
      handleBrowseModeChange('file');
    } else if (path === ROUTES.EDIT) {
      setActiveMenu('edit');
      handleBrowseModeChange('file');
    } else if (path === ROUTES.GENERATE) {
      setActiveMenu('generate');
      handleBrowseModeChange('file');
    }
  }, [location.pathname, setActiveMenu, handleBrowseModeChange]);

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

  // Desktop 平台：检查是否在项目窗口模式
  const [projectSourceId] = useState<string | null>(() => {
    if (isWeb()) return null;
    const hash = window.location.hash;
    if (hash.startsWith('#project')) {
      const idx = hash.indexOf('?');
      const query = idx >= 0 ? new URLSearchParams(hash.slice(idx + 1)) : null;
      const id = query?.get('id');
      return id || null;
    }
    return null;
  });

  // Desktop 平台：如果是项目窗口模式，显示项目页面
  if (!isWeb() && projectSourceId) {
    return <ProjectPage projectSourceId={projectSourceId} />;
  }

  // 获取平台类型
  const platform = getPlatform();

  // Web 平台：动态导入 DevTools（代码分割）
  const [DevToolsComponent, setDevToolsComponent] =
    useState<React.ReactElement | null>(null);

  useEffect(() => {
    if (isWeb() && import.meta.env.VITE_ENABLE_DEVTOOLS === 'true') {
      Promise.all([
        import('@packages/common/src'),
        import('./platforms/web/services/performanceService'),
      ]).then(([commonModule, perfModule]) => {
        const DevTools = commonModule.DevTools;
        setDevToolsComponent(
          <DevTools
            performanceMonitor={perfModule.performanceService.getMonitor()}
            t={t}
          />,
        );
      });
    }
  }, [t]);

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
                navigate(ROUTES.PHOTOS);
                setCurrentView('photos');
                setCurrentUtilityTool(null);
              } else if (menuItem.mode === 'slide') {
                navigate(ROUTES.SLIDESHOW);
                setCurrentView('photos');
                setCurrentUtilityTool(null);
              } else if (menuItem.mode === 'timeline') {
                navigate(ROUTES.TIMELINE);
                setCurrentView('photos');
                setCurrentUtilityTool(null);
              }
            } else if (menuItem.type === 'utility') {
              const routeMap: Record<string, string> = {
                compress: ROUTES.COMPRESS,
                convert: ROUTES.CONVERT,
                analyze: ROUTES.ANALYZE,
                edit: ROUTES.EDIT,
                generate: ROUTES.GENERATE,
              };
              const route = routeMap[menuItem.tool];
              if (route) {
                navigate(route);
              }
              setCurrentUtilityTool(menuItem.tool);
              setCurrentView('photos');
              handleBrowseModeChange('file');
            } else if (menuItem.type === 'view') {
              setCurrentView(menuItem.view);
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
          <AppRoutes
            onOpenConfigModal={handleOpenConfigModal}
            isFullscreenMode={isFullscreenMode}
            setIsFullscreenMode={setIsFullscreenMode}
            fileModeClass={fileModeClass}
          />
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
        platform={platform}
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

      {/* Web 平台：PWA 功能组件 */}
      {isWeb() && (
        <Suspense fallback={null}>
          <PWAInstallPrompt />
        </Suspense>
      )}

      {/* Web 平台：DevTools 调试工具 - 通过环境变量控制 */}
      {DevToolsComponent}

      {/* 全屏 Loading - 数据请求时显示 */}
      <FullScreenLoading
        visible={loading}
        text={loading ? t('app.loadingImages') : undefined}
      />
    </div>
  );
}

export default App;
