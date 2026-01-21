import { useDemoMode } from '@packages/common/src';
import { useCallback, useMemo } from 'react';
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
import { AppRoutes } from './router/routes';
import { useImageStore } from './stores/imageStore';
import { useSourceStore } from './stores/sourceStore';
import { useUIStore } from './stores/uiStore';

// 主应用组件（统一 Web 和 Desktop）
function App() {
  const { t } = useI18n();
  const { loadImages, uploadImage, uploadMultipleImages } = useImageStore();

  const { sources, selectedSourceId } = useSourceStore();

  // Demo 模式管理
  const { isDemoMode } = useDemoMode();

  // UI 状态管理（应用级别，使用 zustand）
  const {
    showConfigModal,
    editingSourceId,
    setEditingSourceId,
    showKeyboardHelp,
    showVersionInfo,
    isFullscreenMode,
    setIsFullscreenMode,
    openConfigModal,
    closeConfigModal,
    openKeyboardHelp,
    closeKeyboardHelp,
    openVersionInfo,
    closeVersionInfo,
    addSource,
    closeSourceTypeMenu,
  } = useUIStore();

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

  // 判断是否有配置
  const hasConfig = sources.length > 0;

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
      const newEditingId = handleEditSource(sourceId);
      if (newEditingId) {
        setEditingSourceId(newEditingId);
        openConfigModal();
      }
    },
    [handleEditSource, setEditingSourceId, openConfigModal],
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
    closeConfigModal,
    openKeyboardHelp,
    openVersionInfo,
    closeKeyboardHelp,
    closeVersionInfo,
    handleLoadImages,
    openConfigModal,
  );

  // 处理源类型选择
  const handleSelectSourceType = useCallback(
    (type: 'github' | 'gitee') => {
      setEditingSourceId(null);
      useImageStore.setState({ storageType: type });
      closeSourceTypeMenu();
      openConfigModal();
    },
    [setEditingSourceId, closeSourceTypeMenu, openConfigModal],
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
        onUploadImage={uploadImage}
        onUploadMultipleImages={uploadMultipleImages}
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
