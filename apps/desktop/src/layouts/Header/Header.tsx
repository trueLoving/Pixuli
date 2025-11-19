import { KeyboardHelpModal, LanguageSwitcher } from '@packages/ui/src';
import { FileText, HelpCircle, Info, Play, RefreshCw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { SlideShowPlayer } from '@packages/ui/src';
import { OperationLogModal, VersionInfoModal } from '../../features';

interface HeaderProps {
  /** 存储类型 */
  storageType: 'github' | 'gitee' | null;
  /** GitHub 配置 */
  githubConfig?: {
    owner: string;
    repo: string;
    branch: string;
    token: string;
    path: string;
  } | null;
  /** Gitee 配置 */
  giteeConfig?: {
    owner: string;
    repo: string;
    branch: string;
    token: string;
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
  /** 设置 Gitee 配置 */
  onSetGiteeConfig: (config: any) => void;
  /** 清除 Gitee 配置 */
  onClearGiteeConfig: () => void;
  /** AI 分析完成回调 */
  onAnalysisComplete: (result: any) => void;
  /** 是否为项目窗口模式（项目窗口显示仓库信息，主页面不显示） */
  isProjectWindow?: boolean;
  /** 图片列表（用于幻灯片播放） */
  images?: any[];
}

const Header: React.FC<HeaderProps> = ({
  storageType,
  githubConfig,
  giteeConfig,
  loading,
  t,
  currentLanguage,
  availableLanguages,
  onLanguageChange,
  onLoadImages,
  isProjectWindow = false,
  images = [],
}) => {
  // 模态框状态管理
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showVersionInfo, setShowVersionInfo] = useState(false);
  const [showOperationLog, setShowOperationLog] = useState(false);
  const [showSlideShow, setShowSlideShow] = useState(false);

  const handleOpenKeyboardHelp = () => setShowKeyboardHelp(true);
  const handleCloseKeyboardHelp = () => setShowKeyboardHelp(false);
  const handleOpenVersionInfo = () => setShowVersionInfo(true);
  const handleCloseVersionInfo = () => setShowVersionInfo(false);
  const handleOpenOperationLog = () => setShowOperationLog(true);
  const handleCloseOperationLog = () => setShowOperationLog(false);

  // 监听键盘快捷键事件和IPC消息
  useEffect(() => {
    const handleOpenKeyboardHelp = () => setShowKeyboardHelp(true);

    window.addEventListener('openKeyboardHelp', handleOpenKeyboardHelp);

    return () => {
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
            {/* 只在项目窗口模式显示仓库信息 */}
            {isProjectWindow && (
              <div className="text-sm text-gray-500 hidden sm:block">
                {storageType === 'github' && githubConfig && (
                  <>
                    {t('sourceManager.repository')}: {githubConfig.owner}/
                    {githubConfig.repo}
                  </>
                )}
                {storageType === 'gitee' && giteeConfig && (
                  <>
                    {t('sourceManager.repository')}: {giteeConfig.owner}/
                    {giteeConfig.repo}
                  </>
                )}
              </div>
            )}
          </div>

          {/* 右侧操作按钮 */}
          <div className="flex items-center space-x-3">
            {/* 语言切换器 */}
            {!isProjectWindow && (
              <LanguageSwitcher
                currentLanguage={currentLanguage}
                availableLanguages={availableLanguages}
                onLanguageChange={onLanguageChange}
                switchTitle={t('language.switch')}
                currentTitle={t('language.current')}
                showBackdrop={false}
              />
            )}
            {/* 刷新按钮 */}
            {isProjectWindow && (
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
            )}
            {/* 幻灯片播放按钮 */}
            {isProjectWindow && images.length > 0 && (
              <button
                onClick={() => setShowSlideShow(true)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                title={t('slideShow.open')}
              >
                <Play className="w-5 h-5" />
              </button>
            )}

            {/* 键盘帮助 */}
            <button
              onClick={handleOpenKeyboardHelp}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              title={t('navigation.help')}
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            {/* 操作日志 */}
            <button
              onClick={handleOpenOperationLog}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              title={t('header.operationLog')}
            >
              <FileText className="w-5 h-5" />
            </button>
            {/* 版本信息 */}
            <button
              onClick={handleOpenVersionInfo}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              title={t('version.title')}
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 键盘快捷键帮助模态框 */}
      <KeyboardHelpModal
        t={t}
        isOpen={showKeyboardHelp}
        onClose={handleCloseKeyboardHelp}
        categories={keyboardCategories}
      />

      {/* 操作日志模态框 */}
      <OperationLogModal
        isOpen={showOperationLog}
        onClose={handleCloseOperationLog}
      />

      {/* 版本信息模态框 */}
      <VersionInfoModal
        t={t}
        isOpen={showVersionInfo}
        onClose={handleCloseVersionInfo}
      />

      {/* 幻灯片播放器 */}
      <SlideShowPlayer
        isOpen={showSlideShow}
        onClose={() => setShowSlideShow(false)}
        images={images}
        t={t}
      />
    </header>
  );
};

export default Header;
