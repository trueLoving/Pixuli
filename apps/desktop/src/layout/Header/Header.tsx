import {
  GitHubConfigModal,
  KeyboardHelpModal,
  LanguageSwitcher,
  UpyunConfigModal,
} from '@packages/ui/src';
import {
  ArrowRightLeft,
  Brain,
  HelpCircle,
  RefreshCw,
  Settings,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  AIAnalysisModal,
  ImageCompression,
  ImageConverter,
} from '../../components';

interface HeaderProps {
  /** 存储类型 */
  storageType: 'github' | 'upyun' | null;
  /** GitHub 配置 */
  githubConfig?: {
    owner: string;
    repo: string;
    branch: string;
    token: string;
    path: string;
  } | null;
  /** 又拍云配置 */
  upyunConfig?: {
    bucket: string;
    operator: string;
    password: string;
    domain: string;
    path: string;
  } | null;
  /** 是否正在加载 */
  loading: boolean;
  /** 翻译函数 */
  t: (key: string) => string;
  /** 当前语言 */
  currentLanguage: string;
  /** 可用语言列表 */
  availableLanguages: Array<{
    code: string;
    name: string;
    flag: string;
  }>;
  /** 语言切换回调 */
  onLanguageChange: (code: string) => void;
  /** 刷新图片 */
  onLoadImages: () => void;
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
}

const Header: React.FC<HeaderProps> = ({
  storageType,
  githubConfig,
  upyunConfig,
  loading,
  t,
  currentLanguage,
  availableLanguages,
  onLanguageChange,
  onLoadImages,
  onSaveConfig,
  onClearConfig,
  onSetUpyunConfig,
  onClearUpyunConfig,
  onAnalysisComplete,
}) => {
  // 模态框状态管理
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showUpyunConfigModal, setShowUpyunConfigModal] = useState(false);
  const [showCompression, setShowCompression] = useState(false);
  const [showFormatConversion, setShowFormatConversion] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // 模态框控制函数
  const handleOpenConfigModal = () => setShowConfigModal(true);
  const handleCloseConfigModal = () => setShowConfigModal(false);
  const handleOpenUpyunConfigModal = () => setShowUpyunConfigModal(true);
  const handleCloseUpyunConfigModal = () => setShowUpyunConfigModal(false);
  const handleOpenCompression = () => setShowCompression(true);
  const handleCloseCompression = () => setShowCompression(false);
  const handleOpenFormatConversion = () => setShowFormatConversion(true);
  const handleCloseFormatConversion = () => setShowFormatConversion(false);
  const handleOpenAIAnalysis = () => setShowAIAnalysis(true);
  const handleCloseAIAnalysis = () => setShowAIAnalysis(false);
  const handleOpenKeyboardHelp = () => setShowKeyboardHelp(true);
  const handleCloseKeyboardHelp = () => setShowKeyboardHelp(false);

  const handleSaveConfig = (config: any) => {
    onSaveConfig(config);
    setShowConfigModal(false);
  };

  const handleClearConfig = () => {
    onClearConfig();
    setShowConfigModal(false);
  };

  // 监听键盘快捷键事件
  useEffect(() => {
    const handleOpenCompression = () => setShowCompression(true);
    const handleOpenFormatConversion = () => setShowFormatConversion(true);
    const handleOpenAIAnalysis = () => setShowAIAnalysis(true);
    const handleOpenKeyboardHelp = () => setShowKeyboardHelp(true);

    window.addEventListener('openCompression', handleOpenCompression);
    window.addEventListener('openFormatConversion', handleOpenFormatConversion);
    window.addEventListener('openAIAnalysis', handleOpenAIAnalysis);
    window.addEventListener('openKeyboardHelp', handleOpenKeyboardHelp);

    return () => {
      window.removeEventListener('openCompression', handleOpenCompression);
      window.removeEventListener(
        'openFormatConversion',
        handleOpenFormatConversion
      );
      window.removeEventListener('openAIAnalysis', handleOpenAIAnalysis);
      window.removeEventListener('openKeyboardHelp', handleOpenKeyboardHelp);
    };
  }, []);

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

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 左侧标题和存储信息 */}
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">Pixuli</h1>
            <div className="text-sm text-gray-500 hidden sm:block">
              {storageType === 'github' && githubConfig && (
                <>
                  仓库: {githubConfig.owner}/{githubConfig.repo}
                </>
              )}
              {storageType === 'upyun' && upyunConfig && (
                <>又拍云: {upyunConfig.bucket}</>
              )}
            </div>
          </div>

          {/* 右侧操作按钮 */}
          <div className="flex items-center space-x-3">
            {/* 图片压缩工具 */}
            <button
              onClick={handleOpenCompression}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              title={t('image.compression')}
            >
              <Zap className="w-5 h-5" />
            </button>

            {/* 图片格式转换 */}
            <button
              onClick={handleOpenFormatConversion}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              title={t('image.formatConversion')}
            >
              <ArrowRightLeft className="w-5 h-5" />
            </button>

            {/* AI 分析 */}
            <button
              onClick={handleOpenAIAnalysis}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              title={t('image.aiAnalysis')}
            >
              <Brain className="w-5 h-5" />
            </button>

            {/* GitHub 配置 */}
            {storageType === 'github' && githubConfig && (
              <button
                onClick={handleOpenConfigModal}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                title={t('navigation.settings')}
              >
                <Settings className="w-5 h-5" />
              </button>
            )}

            {/* 又拍云配置 */}
            {storageType === 'upyun' && upyunConfig && (
              <button
                onClick={handleOpenUpyunConfigModal}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                title={t('navigation.upyunSettings')}
              >
                <Settings className="w-5 h-5" />
              </button>
            )}

            {/* 刷新按钮 */}
            <button
              onClick={onLoadImages}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              title={t('navigation.refresh')}
            >
              <RefreshCw
                className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
              />
            </button>

            {/* 键盘帮助 */}
            <button
              onClick={handleOpenKeyboardHelp}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              title={t('navigation.help')}
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* 语言切换器 */}
            <LanguageSwitcher
              currentLanguage={currentLanguage}
              availableLanguages={availableLanguages}
              onLanguageChange={onLanguageChange}
              switchTitle={t('language.switch')}
              currentTitle={t('language.current')}
              showBackdrop={false}
            />
          </div>
        </div>
      </div>

      {/* GitHub 配置模态框 */}
      <GitHubConfigModal
        t={t}
        isOpen={showConfigModal}
        onClose={handleCloseConfigModal}
        githubConfig={githubConfig}
        onSaveConfig={handleSaveConfig}
        onClearConfig={handleClearConfig}
      />

      {/* 又拍云配置模态框 */}
      <UpyunConfigModal
        t={t}
        isOpen={showUpyunConfigModal}
        onClose={handleCloseUpyunConfigModal}
        upyunConfig={upyunConfig}
        onSaveConfig={onSetUpyunConfig}
        onClearConfig={onClearUpyunConfig}
        platform="desktop"
      />

      {/* 图片压缩模态框 */}
      <ImageCompression
        isOpen={showCompression}
        onClose={handleCloseCompression}
      />

      {/* 图片格式转换模态框 */}
      <ImageConverter
        isOpen={showFormatConversion}
        onClose={handleCloseFormatConversion}
      />

      {/* AI 分析模态框 */}
      <AIAnalysisModal
        isOpen={showAIAnalysis}
        onClose={handleCloseAIAnalysis}
        onAnalysisComplete={onAnalysisComplete}
      />

      {/* 键盘快捷键帮助模态框 */}
      <KeyboardHelpModal
        t={t}
        isOpen={showKeyboardHelp}
        onClose={handleCloseKeyboardHelp}
        categories={keyboardCategories}
      />
    </header>
  );
};

export default Header;
