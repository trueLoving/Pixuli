import {
  BatchUploadProgress,
  formatFileSize,
  getImageDimensionsFromUrl,
  GitHubConfigModal,
  ImageBrowser,
  ImageItem,
  ImageSearch,
  ImageUpload,
  ImageUploadData,
  KeyboardHelpModal,
  MultiImageUploadData,
  UpyunConfigModal,
} from '@packages/ui/src';
import { RefreshCw } from 'lucide-react';
import React from 'react';

interface HomeProps {
  /** 翻译函数 */
  t: (key: string) => string;
  /** 错误信息 */
  error?: string | null;
  /** 清除错误 */
  onClearError: () => void;
  /** 搜索词 */
  searchTerm: string;
  /** 搜索词变化回调 */
  onSearchChange: (term: string) => void;
  /** 选中的标签 */
  selectedTags: string[];
  /** 标签变化回调 */
  onTagsChange: (tags: string[]) => void;
  /** 所有标签 */
  allTags: string[];
  /** 上传图片 */
  onUploadImage: (file: File) => Promise<void>;
  /** 批量上传图片 */
  onUploadMultipleImages: (files: File[]) => Promise<void>;
  /** 是否正在加载 */
  loading: boolean;
  /** 批量上传进度 */
  batchUploadProgress?: BatchUploadProgress | null;
  /** 过滤后的图片列表 */
  filteredImages: ImageItem[];
  /** 删除图片 */
  onDeleteImage: (imageId: string, fileName: string) => Promise<void>;
  /** 更新图片 */
  onUpdateImage: (data: any) => Promise<void>;
  /** GitHub 配置 */
  githubConfig?: any;
  /** 又拍云配置 */
  upyunConfig?: any;
  /** 是否显示 GitHub 配置模态框 */
  showConfigModal: boolean;
  /** 是否显示又拍云配置模态框 */
  showUpyunConfigModal: boolean;
  /** 是否显示压缩工具 */
  showCompression: boolean;
  /** 是否显示格式转换 */
  showFormatConversion: boolean;
  /** 是否显示 AI 分析 */
  showAIAnalysis: boolean;
  /** 是否显示键盘帮助 */
  showKeyboardHelp: boolean;
  /** 关闭 GitHub 配置模态框 */
  onCloseConfigModal: () => void;
  /** 关闭又拍云配置模态框 */
  onCloseUpyunConfigModal: () => void;
  /** 关闭压缩工具 */
  onCloseCompression: () => void;
  /** 关闭格式转换 */
  onCloseFormatConversion: () => void;
  /** 关闭 AI 分析 */
  onCloseAIAnalysis: () => void;
  /** 关闭键盘帮助 */
  onCloseKeyboardHelp: () => void;
  /** 保存 GitHub 配置 */
  onSaveConfig: (config: any) => void;
  /** 清除 GitHub 配置 */
  onClearConfig: () => void;
  /** 设置又拍云配置 */
  onSetUpyunConfig: (config: any) => void;
  /** 清除又拍云配置 */
  onClearUpyunConfig: () => void;
  /** AI 分析完成回调 */
  onAnalysisComplete: (result: any) => void;
  /** 键盘快捷键分类 */
  keyboardCategories: Array<{
    name: string;
    shortcuts: Array<{
      description: string;
      key: string;
      ctrlKey?: boolean;
    }>;
  }>;
  /** 压缩组件 */
  ImageCompression: React.ComponentType<{ onClose: () => void }>;
  /** 格式转换组件 */
  ImageConverter: React.ComponentType<{ onClose: () => void }>;
  /** AI 分析组件 */
  AIAnalysisModal: React.ComponentType<any>;
}

const Home: React.FC<HomeProps> = ({
  t,
  error,
  onClearError,
  searchTerm,
  onSearchChange,
  selectedTags,
  onTagsChange,
  allTags,
  onUploadImage,
  onUploadMultipleImages,
  loading,
  batchUploadProgress,
  filteredImages,
  onDeleteImage,
  onUpdateImage,
  githubConfig,
  upyunConfig,
  showConfigModal,
  showUpyunConfigModal,
  showCompression,
  showFormatConversion,
  showAIAnalysis,
  showKeyboardHelp,
  onCloseConfigModal,
  onCloseUpyunConfigModal,
  onCloseCompression,
  onCloseFormatConversion,
  onCloseAIAnalysis,
  onCloseKeyboardHelp,
  onSaveConfig,
  onClearConfig,
  onSetUpyunConfig,
  onClearUpyunConfig,
  onAnalysisComplete,
  keyboardCategories,
  ImageCompression,
  ImageConverter,
  AIAnalysisModal,
}) => {
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* 主内容区域 - 可滚动 */}
      <main className="flex-1 overflow-y-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-red-800">{error}</p>
                <button
                  onClick={onClearError}
                  className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* 搜索和过滤区域 */}
          <ImageSearch
            t={t}
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            selectedTags={selectedTags}
            onTagsChange={onTagsChange}
            allTags={allTags}
          />

          {/* 图片上传区域 */}
          <div className="mb-4">
            <ImageUpload
              t={t}
              onUploadImage={(data: ImageUploadData) =>
                onUploadImage(data.file)
              }
              onUploadMultipleImages={(data: MultiImageUploadData) =>
                onUploadMultipleImages(data.files)
              }
              loading={loading}
              batchUploadProgress={batchUploadProgress}
            />
          </div>

          {/* 图片统计和操作区域 */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('image.library')} ({filteredImages.length} {t('image.count')})
            </h2>
            {loading && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t('common.loading')}</span>
              </div>
            )}
          </div>

          {/* 图片浏览 */}
          <div className="min-h-0">
            <ImageBrowser
              t={t}
              images={filteredImages}
              onDeleteImage={onDeleteImage}
              onUpdateImage={onUpdateImage}
              getImageDimensionsFromUrl={getImageDimensionsFromUrl}
              formatFileSize={formatFileSize}
            />
          </div>
        </div>
      </main>

      {/* GitHub 配置模态框 */}
      <GitHubConfigModal
        t={t}
        isOpen={showConfigModal}
        onClose={onCloseConfigModal}
        githubConfig={githubConfig}
        onSaveConfig={onSaveConfig}
        onClearConfig={onClearConfig}
      />

      {/* 又拍云配置模态框 */}
      <UpyunConfigModal
        t={t}
        isOpen={showUpyunConfigModal}
        onClose={onCloseUpyunConfigModal}
        upyunConfig={upyunConfig}
        onSaveConfig={onSetUpyunConfig}
        onClearConfig={onClearUpyunConfig}
        platform="desktop"
      />

      {/* 图片压缩模态框 */}
      {showCompression && <ImageCompression onClose={onCloseCompression} />}

      {/* 图片格式转换模态框 */}
      {showFormatConversion && (
        <ImageConverter onClose={onCloseFormatConversion} />
      )}

      {/* AI 分析模态框 */}
      <AIAnalysisModal
        isOpen={showAIAnalysis}
        onClose={onCloseAIAnalysis}
        onAnalysisComplete={onAnalysisComplete}
      />

      {/* 键盘快捷键帮助模态框 */}
      <KeyboardHelpModal
        t={t}
        isOpen={showKeyboardHelp}
        onClose={onCloseKeyboardHelp}
        categories={keyboardCategories}
      />
    </div>
  );
};

export default Home;
