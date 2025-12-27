import {
  BrowseMode,
  FullScreenLoading,
  GitHubConfigModal,
  GiteeConfigModal,
  Header,
  Search,
  ImageBrowser,
  KeyboardHelpModal,
  LanguageSwitcher,
  RefreshButton,
  Toaster,
  SlideShowPlayer,
  UploadButton,
  VersionInfoModal,
  formatFileSize,
  getImageDimensionsFromUrl,
  type FilterOptions,
  type VersionInfo,
} from '@packages/common/src';
import { createDefaultFilters } from '@packages/common/src/utils/filterUtils';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n/useI18n';
import { useImageStore } from '../../stores/imageStore';
import { useSourceStore } from '../../stores/sourceStore';

// 声明全局版本信息
declare const __VERSION_INFO__: VersionInfo;

interface ProjectPageProps {
  projectSourceId: string | null;
}

export const ProjectPage: React.FC<ProjectPageProps> = ({
  projectSourceId,
}) => {
  const { t, changeLanguage, getCurrentLanguage, getAvailableLanguages } =
    useI18n();
  const sourceStore = useSourceStore();
  const {
    images,
    loading,
    error,
    githubConfig,
    giteeConfig,
    storageType,
    batchUploadProgress,
    loadImages,
    clearError,
    setGitHubConfig,
    clearGitHubConfig,
    setGiteeConfig,
    clearGiteeConfig,
    uploadImage,
    uploadMultipleImages,
    deleteImage,
    deleteMultipleImages,
    updateImage,
  } = useImageStore();

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showGiteeConfigModal, setShowGiteeConfigModal] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showVersionInfo, setShowVersionInfo] = useState(false);
  const [browseMode, setBrowseMode] = useState<BrowseMode>('file');
  const [searchQuery, setSearchQuery] = useState('');
  const [externalFilters, setExternalFilters] = useState<FilterOptions>(
    createDefaultFilters(),
  );
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);

  // 同步搜索查询到筛选条件
  useEffect(() => {
    setExternalFilters((prev: FilterOptions) => ({
      ...prev,
      searchTerm: searchQuery,
    }));
  }, [searchQuery]);

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
  const hasConfig = useMemo(() => {
    return !!(githubConfig || giteeConfig);
  }, [githubConfig, giteeConfig]);

  // 使用 useCallback 来稳定函数引用
  const handleLoadImages = useCallback(async () => {
    try {
      await loadImages();
    } catch (error) {
      console.error('Failed to load images:', error);
    }
  }, [loadImages]);

  // 根据 projectSourceId 设置仓库源配置并初始化
  useEffect(() => {
    if (!projectSourceId) return;

    const src = sourceStore.getSourceById(projectSourceId);
    if (!src) {
      console.error(`Source not found: ${projectSourceId}`);
      return;
    }

    // 根据源类型设置配置
    if (src.type === 'github') {
      setGitHubConfig({
        owner: src.owner,
        repo: src.repo,
        branch: src.branch,
        token: src.token,
        path: src.path,
      } as any);
      // 设置存储类型为 GitHub
      useImageStore.setState({ storageType: 'github' });
    } else if (src.type === 'gitee') {
      setGiteeConfig({
        owner: src.owner,
        repo: src.repo,
        branch: src.branch,
        token: src.token,
        path: src.path,
      } as any);
      // 设置存储类型为 Gitee
      useImageStore.setState({ storageType: 'gitee' });
    }
  }, [projectSourceId, sourceStore, setGitHubConfig, setGiteeConfig]);

  // 初始化存储服务并加载图片
  useEffect(() => {
    if (!projectSourceId) return;

    const state = useImageStore.getState();
    // 等待配置设置完成后再初始化
    if (state.githubConfig || state.giteeConfig) {
      // 如果存储服务未初始化，则初始化
      if (!state.storageService) {
        state.initializeStorage();
      }
      // 加载图片
      handleLoadImages();
    }
  }, [projectSourceId, githubConfig, giteeConfig, handleLoadImages]);

  const handleOpenConfigModal = useCallback(() => {
    setShowConfigModal(true);
  }, []);

  const handleCloseConfigModal = useCallback(() => {
    setShowConfigModal(false);
  }, []);

  const handleSaveConfig = useCallback(
    (config: any) => {
      setGitHubConfig(config);
      setShowConfigModal(false);
    },
    [setGitHubConfig],
  );

  const handleClearConfig = useCallback(() => {
    clearGitHubConfig();
    setShowConfigModal(false);
  }, [clearGitHubConfig]);

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

  // ProjectPage 始终在单独窗口中，不显示 Sidebar，实现沉浸式浏览

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* 主内容区域 - 沉浸式布局，无 Sidebar */}
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
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* 全屏 Loading */}
      <FullScreenLoading visible={loading} text={t('app.loadingImages')} />

      {/* GitHub 配置模态框 */}
      <GitHubConfigModal
        isOpen={showConfigModal && storageType !== 'gitee'}
        onClose={() => {
          setShowConfigModal(false);
          setEditingSourceId(null);
        }}
        githubConfig={githubConfig}
        onSaveConfig={handleSaveConfig}
        onClearConfig={handleClearConfig}
        t={t}
      />

      {/* Gitee 配置模态框 */}
      <GiteeConfigModal
        isOpen={
          showGiteeConfigModal || (showConfigModal && storageType === 'gitee')
        }
        onClose={() => {
          setShowGiteeConfigModal(false);
          setShowConfigModal(false);
          setEditingSourceId(null);
        }}
        giteeConfig={giteeConfig}
        onSaveConfig={(config: any) => {
          setGiteeConfig(config);
          setShowGiteeConfigModal(false);
          setShowConfigModal(false);
        }}
        onClearConfig={() => {
          clearGiteeConfig();
          setShowGiteeConfigModal(false);
          setShowConfigModal(false);
        }}
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
      {browseMode === 'slide' && (
        <SlideShowPlayer
          isOpen={true}
          onClose={() => setBrowseMode('file')}
          images={images}
          t={t}
        />
      )}

      <Toaster />
    </div>
  );
};

export default ProjectPage;
export type { ProjectPageProps };
