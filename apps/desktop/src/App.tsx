import {
  COMMON_SHORTCUTS,
  SHORTCUT_CATEGORIES,
  keyboardManager,
} from '@packages/ui/src';
import { useCallback, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import './App.css';
import {
  AIAnalysisModal,
  ImageCompression,
  ImageConverter,
} from './components';
import { useI18n } from './i18n/useI18n';
import { Header, Home, WelcomePage } from './layout';
import { useImageStore } from './stores/imageStore';

function App() {
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
  const [showCompression, setShowCompression] = useState(false);
  const [showFormatConversion, setShowFormatConversion] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // 键盘快捷键分类数据
  const keyboardCategories = [
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
        {
          description: t('keyboard.shortcuts.openConfig'),
          key: '.',
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
      name: t('keyboard.categories.features'),
      shortcuts: [
        {
          description: t('keyboard.shortcuts.openCompression'),
          key: 'C',
          ctrlKey: true,
        },
        {
          description: t('keyboard.shortcuts.openFormatConversion'),
          key: 'F',
          ctrlKey: true,
        },
        {
          description: t('keyboard.shortcuts.openAIAnalysis'),
          key: 'A',
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
        { description: t('keyboard.shortcuts.selectRight'), key: 'ArrowRight' },
        { description: t('keyboard.shortcuts.openSelected'), key: 'Enter' },
      ],
    },
  ];

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

  const handleOpenCompression = useCallback(() => {
    console.log('Opening compression modal, current state:', showCompression);
    setShowCompression(true);
    console.log('State set to true, new state:', true);
  }, [showCompression]);

  const handleCloseCompression = useCallback(() => {
    setShowCompression(false);
  }, []);

  const handleOpenFormatConversion = useCallback(() => {
    setShowFormatConversion(true);
  }, []);

  const handleCloseFormatConversion = useCallback(() => {
    setShowFormatConversion(false);
  }, []);

  const handleOpenAIAnalysis = useCallback(() => {
    setShowAIAnalysis(true);
  }, []);

  const handleCloseAIAnalysis = useCallback(() => {
    setShowAIAnalysis(false);
  }, []);

  const handleOpenKeyboardHelp = useCallback(() => {
    setShowKeyboardHelp(true);
  }, []);

  const handleCloseKeyboardHelp = useCallback(() => {
    setShowKeyboardHelp(false);
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
          else if (showCompression) handleCloseCompression();
          else if (showFormatConversion) handleCloseFormatConversion();
          else if (showAIAnalysis) handleCloseAIAnalysis();
          else if (showKeyboardHelp) handleCloseKeyboardHelp();
        },
        category: SHORTCUT_CATEGORIES.GENERAL,
      },
      {
        key: COMMON_SHORTCUTS.F1,
        description: t('keyboard.shortcuts.showHelp'),
        action: handleOpenKeyboardHelp,
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
        action: handleOpenCompression,
        category: SHORTCUT_CATEGORIES.GENERAL,
      },
      {
        key: COMMON_SHORTCUTS.F,
        ctrlKey: true,
        description: t('keyboard.shortcuts.openFormatConversion'),
        action: handleOpenFormatConversion,
        category: SHORTCUT_CATEGORIES.GENERAL,
      },
      {
        key: COMMON_SHORTCUTS.A,
        ctrlKey: true,
        description: t('keyboard.shortcuts.openAIAnalysis'),
        action: handleOpenAIAnalysis,
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
    showCompression,
    showFormatConversion,
    showAIAnalysis,
    showKeyboardHelp,
    handleCloseConfigModal,
    handleCloseCompression,
    handleCloseFormatConversion,
    handleCloseAIAnalysis,
    handleCloseKeyboardHelp,
    handleOpenKeyboardHelp,
    handleLoadImages,
    handleOpenCompression,
    handleOpenFormatConversion,
    handleOpenAIAnalysis,
    handleOpenConfigModal,
  ]);

  // 过滤图片
  const filteredImages = images.filter(image => {
    const matchesSearch =
      image.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some(tag => image.tags?.includes(tag));

    return matchesSearch && matchesTags;
  });

  // 获取所有标签
  const allTags = Array.from(new Set(images.flatMap(img => img.tags || [])));

  if (!githubConfig && !upyunConfig) {
    return (
      <WelcomePage
        t={t}
        githubConfig={githubConfig}
        upyunConfig={upyunConfig}
        showConfigModal={showConfigModal}
        showUpyunConfigModal={showUpyunConfigModal}
        showCompression={showCompression}
        onOpenConfigModal={handleOpenConfigModal}
        onCloseConfigModal={handleCloseConfigModal}
        onOpenUpyunConfigModal={handleOpenUpyunConfigModal}
        onCloseUpyunConfigModal={handleCloseUpyunConfigModal}
        onCloseCompression={handleCloseCompression}
        onSaveConfig={handleSaveConfig}
        onClearConfig={handleClearConfig}
        onSetUpyunConfig={setUpyunConfig}
        onClearUpyunConfig={clearUpyunConfig}
        ImageCompression={ImageCompression}
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
        onOpenCompression={handleOpenCompression}
        onOpenFormatConversion={handleOpenFormatConversion}
        onOpenAIAnalysis={handleOpenAIAnalysis}
        onOpenConfigModal={handleOpenConfigModal}
        onOpenUpyunConfigModal={handleOpenUpyunConfigModal}
        onLoadImages={handleLoadImages}
        onOpenKeyboardHelp={handleOpenKeyboardHelp}
      />

      {/* 主页内容 */}
      <div className="flex-1 overflow-hidden">
        <Home
          t={t}
          error={error}
          onClearError={clearError}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          allTags={allTags}
          onUploadImage={(file: File) => uploadImage({ file })}
          onUploadMultipleImages={(files: File[]) =>
            uploadMultipleImages({ files })
          }
          loading={loading}
          batchUploadProgress={batchUploadProgress}
          filteredImages={filteredImages}
          onDeleteImage={(imageId: string, fileName: string) =>
            handleDeleteImage(imageId, fileName)
          }
          onUpdateImage={(data: any) => handleUpdateImage(data)}
          githubConfig={githubConfig}
          upyunConfig={upyunConfig}
          showConfigModal={showConfigModal}
          showUpyunConfigModal={showUpyunConfigModal}
          showCompression={showCompression}
          showFormatConversion={showFormatConversion}
          showAIAnalysis={showAIAnalysis}
          showKeyboardHelp={showKeyboardHelp}
          onCloseConfigModal={handleCloseConfigModal}
          onCloseUpyunConfigModal={handleCloseUpyunConfigModal}
          onCloseCompression={handleCloseCompression}
          onCloseFormatConversion={handleCloseFormatConversion}
          onCloseAIAnalysis={handleCloseAIAnalysis}
          onCloseKeyboardHelp={handleCloseKeyboardHelp}
          onSaveConfig={handleSaveConfig}
          onClearConfig={handleClearConfig}
          onSetUpyunConfig={setUpyunConfig}
          onClearUpyunConfig={clearUpyunConfig}
          onAnalysisComplete={result => {
            console.log('AI 分析完成:', result);
          }}
          keyboardCategories={keyboardCategories}
          ImageCompression={ImageCompression}
          ImageConverter={ImageConverter}
          AIAnalysisModal={AIAnalysisModal}
        />
      </div>

      <Toaster />
    </div>
  );
}

export default App;
