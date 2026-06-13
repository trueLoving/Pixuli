import { useDemoMode } from '@pixuli/ui';
import { useCallback, useEffect, useMemo } from 'react';
import './App.css';
import { SearchProvider } from './contexts/SearchContext';
import {
  useAppInitialization,
  useConfigManagement,
  useKeyboardShortcuts,
  useSelectedSourceSync,
  useSourceManagement,
} from './hooks';
import { useI18n } from './i18n/useI18n';
import { MainLayout } from './layouts/MainLayout';
import { isDesktopWorkspaceAvailable } from './platforms/desktop/workspaceAdapter';
import { AppRoutes } from './router/routes';
import { useImageStore } from './stores/imageStore';
import { useSourceStore } from './stores/sourceStore';
import { useUIStore } from './stores/uiStore';
import { useWorkspaceStore } from './stores/workspaceStore';

// 主应用组件（统一 Web 和 Desktop）
function App() {
  const { t } = useI18n();
  const { loadImages, uploadImage, uploadMultipleImages } = useImageStore();
  const initializeWorkspace = useWorkspaceStore(state => state.initialize);
  const isLocalActive = useWorkspaceStore(state => state.isLocalActive);
  const importLocalImage = useWorkspaceStore(state => state.importLocalImage);
  const refreshLocalImages = useWorkspaceStore(
    state => state.refreshLocalImages,
  );

  useEffect(() => {
    if (isDesktopWorkspaceAvailable()) {
      void initializeWorkspace();
    }
  }, [initializeWorkspace]);

  const { sources, selectedSourceId } = useSourceStore();

  // Demo 模式管理
  const { isDemoMode } = useDemoMode();

  // UI 状态管理（应用级别，使用 zustand）
  const {
    showConfigModal,
    editingSourceId,
    showKeyboardHelp,
    showVersionInfo,
    showOperationLog,
    isFullscreenMode,
    setIsFullscreenMode,
    openConfigModal,
    closeConfigModal,
    openKeyboardHelp,
    closeKeyboardHelp,
    openVersionInfo,
    closeVersionInfo,
    openOperationLog,
    closeOperationLog,
    addSource,
    closeSourceTypeMenu,
    openConfigModalForEdit,
  } = useUIStore();

  // 源管理
  const sourceManagement = useSourceManagement();
  const {
    selectedSource,
    sidebarSources,
    handleDeleteSource,
    handleSourceSelect,
  } = sourceManagement;

  // 配置管理
  const { handleSaveConfig, handleClearConfig } = useConfigManagement();

  const workspaceMode = useWorkspaceStore(state => state.mode);

  const hasConfig =
    sources.length > 0 ||
    (isDesktopWorkspaceAvailable() && workspaceMode === 'local');

  const handleLoadImages = useCallback(async () => {
    try {
      if (isLocalActive()) {
        await refreshLocalImages();
        return;
      }
      await loadImages();
    } catch (error) {
      console.error('Failed to load images:', error);
    }
  }, [isLocalActive, refreshLocalImages, loadImages]);

  const handleUploadImage = useCallback(
    async (data: Parameters<typeof uploadImage>[0]) => {
      if (isLocalActive()) {
        await importLocalImage(data);
        return;
      }
      await uploadImage(data);
    },
    [isLocalActive, importLocalImage, uploadImage],
  );

  const handleUploadMultipleImages = useCallback(
    async (data: Parameters<typeof uploadMultipleImages>[0]) => {
      if (isLocalActive()) {
        for (const file of data.files) {
          await importLocalImage({
            file,
            name: data.name,
            description: data.description,
            tags: data.tags,
          });
        }
        return;
      }
      await uploadMultipleImages(data);
    },
    [isLocalActive, importLocalImage, uploadMultipleImages],
  );

  // 保存配置（包装以包含 editingSourceId）
  const handleSaveConfigWithId = useMemo(
    () => (config: any) => {
      handleSaveConfig(config, editingSourceId);
      closeConfigModal();
    },
    [handleSaveConfig, editingSourceId, closeConfigModal],
  );

  // 清除配置（包装以包含 editingSourceId）
  const handleClearConfigWithId = useMemo(
    () => () => {
      handleClearConfig(editingSourceId);
      closeConfigModal();
    },
    [handleClearConfig, editingSourceId, closeConfigModal],
  );

  // 编辑源（包装以设置 editingSourceId）
  const handleEditSourceWithId = useMemo(
    () => (sourceId: string) => {
      openConfigModalForEdit(sourceId);
    },
    [openConfigModalForEdit],
  );

  // 删除源（包装以包含翻译函数）
  const handleDeleteSourceWithT = useMemo(
    () => (sourceId: string) => {
      handleDeleteSource(sourceId, t);
    },
    [handleDeleteSource, t],
  );

  // 同步选中源到配置，并在同步后加载图片
  useSelectedSourceSync(selectedSource ?? null, () => {
    if (isLocalActive()) {
      return;
    }
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
    showOperationLog,
    closeConfigModal,
    openKeyboardHelp,
    openVersionInfo,
    closeKeyboardHelp,
    closeVersionInfo,
    openOperationLog,
    closeOperationLog,
    handleLoadImages,
    openConfigModal,
  );

  // 处理源类型选择
  const handleSelectSourceType = useCallback(
    (pluginId: string) => {
      useUIStore.setState({
        editingSourceId: null,
        editingSourcePluginId: null,
        editingSourceRepoConfig: null,
      });
      useImageStore.setState({
        storageType: pluginId as 'github' | 'gitee',
      });
      closeSourceTypeMenu();
      openConfigModal();
    },
    [closeSourceTypeMenu, openConfigModal],
  );

  return (
    <SearchProvider>
      <MainLayout
        sidebarSources={sidebarSources}
        selectedSourceId={selectedSourceId}
        onSourceSelect={handleSourceSelect}
        onSourceEdit={handleEditSourceWithId}
        onSourceDelete={handleDeleteSourceWithT}
        hasConfig={hasConfig}
        onAddSource={addSource}
        onLoadImages={handleLoadImages}
        onUploadImage={handleUploadImage}
        onUploadMultipleImages={handleUploadMultipleImages}
        onSaveConfig={handleSaveConfigWithId}
        onClearConfig={handleClearConfigWithId}
        onSelectSourceType={handleSelectSourceType}
      >
        <AppRoutes
          onOpenConfigModal={openConfigModal}
          isFullscreenMode={isFullscreenMode}
          setIsFullscreenMode={setIsFullscreenMode}
        />
      </MainLayout>
    </SearchProvider>
  );
}

export default App;
