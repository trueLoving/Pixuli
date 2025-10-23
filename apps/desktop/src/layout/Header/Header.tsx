import { LanguageSwitcher } from '@packages/ui/src';
import {
  ArrowRightLeft,
  Brain,
  HelpCircle,
  RefreshCw,
  Settings,
  Zap,
} from 'lucide-react';
import React from 'react';

interface HeaderProps {
  /** 存储类型 */
  storageType: 'github' | 'upyun' | null;
  /** GitHub 配置 */
  githubConfig?: {
    owner: string;
    repo: string;
  } | null;
  /** 又拍云配置 */
  upyunConfig?: {
    bucket: string;
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
  /** 打开压缩工具 */
  onOpenCompression: () => void;
  /** 打开格式转换 */
  onOpenFormatConversion: () => void;
  /** 打开 AI 分析 */
  onOpenAIAnalysis: () => void;
  /** 打开 GitHub 配置 */
  onOpenConfigModal: () => void;
  /** 打开又拍云配置 */
  onOpenUpyunConfigModal: () => void;
  /** 刷新图片 */
  onLoadImages: () => void;
  /** 打开键盘帮助 */
  onOpenKeyboardHelp: () => void;
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
  onOpenCompression,
  onOpenFormatConversion,
  onOpenAIAnalysis,
  onOpenConfigModal,
  onOpenUpyunConfigModal,
  onLoadImages,
  onOpenKeyboardHelp,
}) => {
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
              onClick={onOpenCompression}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              title={t('image.compression')}
            >
              <Zap className="w-5 h-5" />
            </button>

            {/* 图片格式转换 */}
            <button
              onClick={onOpenFormatConversion}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              title={t('image.formatConversion')}
            >
              <ArrowRightLeft className="w-5 h-5" />
            </button>

            {/* AI 分析 */}
            <button
              onClick={onOpenAIAnalysis}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              title={t('image.aiAnalysis')}
            >
              <Brain className="w-5 h-5" />
            </button>

            {/* GitHub 配置 */}
            {storageType === 'github' && githubConfig && (
              <button
                onClick={onOpenConfigModal}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                title={t('navigation.settings')}
              >
                <Settings className="w-5 h-5" />
              </button>
            )}

            {/* 又拍云配置 */}
            {storageType === 'upyun' && upyunConfig && (
              <button
                onClick={onOpenUpyunConfigModal}
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
              onClick={onOpenKeyboardHelp}
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
    </header>
  );
};

export default Header;
