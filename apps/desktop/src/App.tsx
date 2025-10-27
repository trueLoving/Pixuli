import {
  COMMON_SHORTCUTS,
  keyboardManager,
  SHORTCUT_CATEGORIES,
  Toaster,
} from '@packages/ui/src';
import { useCallback, useEffect, useState } from 'react';
import './App.css';
import { ImageCompression, ImageConverter } from './components';
import { useI18n } from './i18n/useI18n';
import { Header, Home, WelcomePage } from './layout';
import { useImageStore } from './stores/imageStore';

function App() {
  // 检查是否在压缩窗口模式
  const [isCompressionMode, setIsCompressionMode] = useState(
    window.location.hash === '#compression'
  );
  // 检查是否在转换窗口模式
  const [isConversionMode, setIsConversionMode] = useState(
    window.location.hash === '#conversion'
  );
  const { t, changeLanguage, getCurrentLanguage, getAvailableLanguages } =
    useI18n();
  const {
    images,
    loading,
    error,
    githubConfig,
    upyunConfig,
    storageType,
    loadImages,
    clearError,
    setGitHubConfig,
    clearGitHubConfig,
    setUpyunConfig,
    clearUpyunConfig,
    uploadImage,
    uploadMultipleImages,
    batchUploadProgress,
    deleteImage,
    updateImage,
  } = useImageStore();

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showUpyunConfigModal, setShowUpyunConfigModal] = useState(false);
  const [showCompressionModal, setShowCompressionModal] = useState(
    window.location.hash === '#compression'
  );
  const [showConversionModal, setShowConversionModal] = useState(
    window.location.hash === '#conversion'
  );

  // 使用 useCallback 来稳定函数引用
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

  // CRUD 操作回调函数
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

  // 初始化存储服务
  useEffect(() => {
    if (githubConfig || upyunConfig) {
      // 确保存储服务已初始化
      const { initializeStorage } = useImageStore.getState();
      initializeStorage();
      handleLoadImages();
    }
  }, [githubConfig, upyunConfig, handleLoadImages]);

  // 页面加载时初始化
  useEffect(() => {
    const { githubConfig, upyunConfig, initializeStorage } =
      useImageStore.getState();
    if (
      (githubConfig || upyunConfig) &&
      !useImageStore.getState().storageService
    ) {
      initializeStorage();
    }
  }, []);

  // 注册键盘快捷键
  useEffect(() => {
    const shortcuts = [
      // 通用快捷键
      {
        key: COMMON_SHORTCUTS.ESCAPE,
        description: t('keyboard.shortcuts.closeModal'),
        action: () => {
          if (showConfigModal) handleCloseConfigModal();
          else if (showUpyunConfigModal) handleCloseUpyunConfigModal();
        },
        category: SHORTCUT_CATEGORIES.GENERAL,
      },
      {
        key: COMMON_SHORTCUTS.F1,
        description: t('keyboard.shortcuts.showHelp'),
        action: () => {
          // 触发键盘帮助事件
          const event = new CustomEvent('openKeyboardHelp');
          window.dispatchEvent(event);
        },
        category: SHORTCUT_CATEGORIES.HELP,
      },
      {
        key: COMMON_SHORTCUTS.F5,
        description: t('keyboard.shortcuts.refresh'),
        action: handleLoadImages,
        category: SHORTCUT_CATEGORIES.GENERAL,
      },

      // 功能快捷键
      {
        key: COMMON_SHORTCUTS.C,
        ctrlKey: true,
        description: t('keyboard.shortcuts.openCompression'),
        action: () => {
          const event = new CustomEvent('openCompression');
          window.dispatchEvent(event);
        },
        category: SHORTCUT_CATEGORIES.GENERAL,
      },
      {
        key: COMMON_SHORTCUTS.F,
        ctrlKey: true,
        description: t('keyboard.shortcuts.openFormatConversion'),
        action: () => {
          const event = new CustomEvent('openFormatConversion');
          window.dispatchEvent(event);
        },
        category: SHORTCUT_CATEGORIES.GENERAL,
      },
      {
        key: COMMON_SHORTCUTS.A,
        ctrlKey: true,
        description: t('keyboard.shortcuts.openAIAnalysis'),
        action: () => {
          const event = new CustomEvent('openAIAnalysis');
          window.dispatchEvent(event);
        },
        category: SHORTCUT_CATEGORIES.GENERAL,
      },
      {
        key: COMMON_SHORTCUTS.COMMA,
        ctrlKey: true,
        description: t('keyboard.shortcuts.openConfig'),
        action: handleOpenConfigModal,
        category: SHORTCUT_CATEGORIES.GENERAL,
      },
      {
        key: COMMON_SHORTCUTS.PERIOD,
        ctrlKey: true,
        description: t('keyboard.shortcuts.openConfig'),
        action: handleOpenUpyunConfigModal,
        category: SHORTCUT_CATEGORIES.GENERAL,
      },

      // 搜索快捷键
      {
        key: COMMON_SHORTCUTS.SLASH,
        description: t('keyboard.shortcuts.focusSearch'),
        action: () => {
          const searchInput = document.querySelector(
            'input[placeholder*="' + t('image.search.placeholder') + '"]'
          ) as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        },
        category: SHORTCUT_CATEGORIES.SEARCH,
      },
      {
        key: COMMON_SHORTCUTS.V,
        ctrlKey: true,
        description: t('keyboard.shortcuts.toggleView'),
        action: () => {
          // 触发图片浏览器的视图切换
          const event = new CustomEvent('toggleViewMode');
          window.dispatchEvent(event);
        },
        category: SHORTCUT_CATEGORIES.IMAGE_BROWSER,
      },
    ];

    keyboardManager.registerBatch(shortcuts);

    return () => {
      shortcuts.forEach(shortcut => keyboardManager.unregister(shortcut));
    };
  }, [
    showConfigModal,
    showUpyunConfigModal,
    handleCloseConfigModal,
    handleCloseUpyunConfigModal,
    handleLoadImages,
    handleOpenConfigModal,
    handleOpenUpyunConfigModal,
    t,
  ]);

  // 如果是转换窗口模式，只显示转换组件
  if (isConversionMode) {
    return (
      <>
        <ImageConverter
          isOpen={showConversionModal}
          onClose={() => {
            // 关闭窗口
            const ipcRenderer = (window as any).ipcRenderer;
            if (ipcRenderer && ipcRenderer.invoke) {
              ipcRenderer.invoke('close-conversion-window');
            }
          }}
        />
        <Toaster />
      </>
    );
  }

  // 如果是压缩窗口模式，只显示压缩组件
  if (isCompressionMode) {
    return (
      <>
        <ImageCompression
          isOpen={showCompressionModal}
          onClose={() => {
            // 关闭窗口
            const ipcRenderer = (window as any).ipcRenderer;
            if (ipcRenderer && ipcRenderer.invoke) {
              ipcRenderer.invoke('close-compression-window');
            }
          }}
        />
        <Toaster />
      </>
    );
  }

  if (!githubConfig && !upyunConfig) {
    return (
      <WelcomePage
        t={t}
        githubConfig={githubConfig}
        upyunConfig={upyunConfig}
        showConfigModal={showConfigModal}
        showUpyunConfigModal={showUpyunConfigModal}
        onOpenConfigModal={handleOpenConfigModal}
        onCloseConfigModal={handleCloseConfigModal}
        onOpenUpyunConfigModal={handleOpenUpyunConfigModal}
        onCloseUpyunConfigModal={handleCloseUpyunConfigModal}
        onSaveConfig={handleSaveConfig}
        onClearConfig={handleClearConfig}
        onSetUpyunConfig={setUpyunConfig}
        onClearUpyunConfig={clearUpyunConfig}
      />
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航栏 */}
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
      />

      {/* 主页内容 */}
      <div className="flex-1 overflow-hidden">
        <Home
          t={t}
          error={error}
          onClearError={clearError}
          onUploadImage={(file: File) => uploadImage({ file })}
          onUploadMultipleImages={(files: File[]) =>
            uploadMultipleImages({ files })
          }
          loading={loading}
          batchUploadProgress={batchUploadProgress}
          images={images}
          onDeleteImage={(imageId: string, fileName: string) =>
            handleDeleteImage(imageId, fileName)
          }
          onUpdateImage={(data: any) => handleUpdateImage(data)}
        />
      </div>

      <Toaster />
    </div>
  );
}

export default App;
