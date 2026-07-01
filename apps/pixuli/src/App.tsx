import { useDemoMode } from '@pixuli/ui';
import { useCallback, useEffect, useMemo } from 'react';
import './App.css';
import { SearchProvider } from './contexts/SearchContext';
import {
  useAppInitialization,
  useCapacitorBackButton,
  useConfigManagement,
  useKeyboardShortcuts,
  useSelectedSourceSync,
  useSourceManagement,
  useWorkspaceBindingSync,
} from './hooks';
import { useI18n } from './i18n/useI18n';
import { MainLayout } from './layouts/MainLayout';
import { isWorkspaceAvailable } from './platforms/workspacePlatform';
import { AppRoutes } from './router/routes';
import { useImageStore } from './stores/imageStore';
import { useSourceStore } from './stores/sourceStore';
import { useUIStore } from './stores/uiStore';
import { useWorkspaceStore } from './stores/workspaceStore';

// 主应用组件（统一 Web 和 Desktop）
function App() {
  const { t } = useI18n();
  const { loadImages } = useImageStore();
  const initializeWorkspace = useWorkspaceStore(state => state.initialize);
  const localActive = useWorkspaceStore(state => state.isLocalActive());

  useEffect(() => {
    if (!isWorkspaceAvailable()) {
      return;
    }
    void initializeWorkspace().then(() => {
      if (useWorkspaceStore.getState().isLocalActive()) {
        void loadImages();
      }
    });
  }, [initializeWorkspace, loadImages]);

  const { sources, selectedSourceId } = useSourceStore();

  // Demo 模式管理
  const { isDemoMode } = useDemoMode();

  // UI 状态管理（应用级别，使用 zustand）
  const {
    showConfigModal,
    editingSourceId,
    showSettingsModal,
    isFullscreenMode,
    setIsFullscreenMode,
    openConfigModal,
    closeConfigModal,
    openKeyboardHelp,
    closeSettingsModal,
    openSettingsModalForAddSource,
    openConfigModalForEdit,
    openOperationLog,
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

  const hasConfig = isWorkspaceAvailable() ? localActive : sources.length > 0;

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

  // 同步选中源到配置（远端源仅用于同步绑定，不触发远端列表加载）
  useSelectedSourceSync(selectedSource ?? null, () => {
    if (isWorkspaceAvailable()) {
      return;
    }
    if (sources.length > 0 && selectedSource) {
      handleLoadImages();
    }
  });

  useWorkspaceBindingSync();

  // 应用初始化
  useAppInitialization(isDemoMode, hasConfig, handleLoadImages);

  // Capacitor Android 返回键（REF-512 #150）
  useCapacitorBackButton();

  // 键盘快捷键
  useKeyboardShortcuts(
    t,
    showConfigModal,
    showSettingsModal,
    closeConfigModal,
    closeSettingsModal,
    openKeyboardHelp,
    openOperationLog,
    handleLoadImages,
    openConfigModal,
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
        onAddSource={openSettingsModalForAddSource}
        onSaveConfig={handleSaveConfigWithId}
        onClearConfig={handleClearConfigWithId}
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
