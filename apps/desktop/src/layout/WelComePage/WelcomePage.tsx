import { GitHubConfigModal, UpyunConfigModal } from '@packages/ui/src';
import { Settings } from 'lucide-react';
import React from 'react';

interface WelcomePageProps {
  /** 翻译函数 */
  t: (key: string) => string;
  /** GitHub 配置 */
  githubConfig?: any;
  /** 又拍云配置 */
  upyunConfig?: any;
  /** 是否显示 GitHub 配置模态框 */
  showConfigModal: boolean;
  /** 是否显示又拍云配置模态框 */
  showUpyunConfigModal: boolean;
  /** 打开 GitHub 配置模态框 */
  onOpenConfigModal: () => void;
  /** 关闭 GitHub 配置模态框 */
  onCloseConfigModal: () => void;
  /** 打开又拍云配置模态框 */
  onOpenUpyunConfigModal: () => void;
  /** 关闭又拍云配置模态框 */
  onCloseUpyunConfigModal: () => void;
  /** 保存 GitHub 配置 */
  onSaveConfig: (config: any) => void;
  /** 清除 GitHub 配置 */
  onClearConfig: () => void;
  /** 设置又拍云配置 */
  onSetUpyunConfig: (config: any) => void;
  /** 清除又拍云配置 */
  onClearUpyunConfig: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({
  t,
  githubConfig,
  upyunConfig,
  showConfigModal,
  showUpyunConfigModal,
  onOpenConfigModal,
  onCloseConfigModal,
  onOpenUpyunConfigModal,
  onCloseUpyunConfigModal,
  onSaveConfig,
  onClearConfig,
  onSetUpyunConfig,
  onClearUpyunConfig,
}) => {
  return (
    <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center w-full max-w-md">
        {/* 图标 */}
        <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <Settings className="w-10 h-10 text-blue-600" />
        </div>

        {/* 标题 */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {t('app.welcome')}
        </h1>

        {/* 副标题 */}
        <p className="text-gray-600 mb-8 text-lg">{t('app.subtitle')}</p>

        {/* 说明文字 */}
        <p className="text-gray-500 mb-6 text-base">{t('app.description')}</p>

        {/* 配置按钮 */}
        <div className="space-y-4">
          <button
            onClick={onOpenConfigModal}
            className="w-full px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 text-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {t('app.configureGitHub')}
          </button>

          {/* 又拍云配置按钮（暂时注释） */}
          {/* <button
            onClick={onOpenUpyunConfigModal}
            className="w-full px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-offset-2 text-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {t('app.configureUpyun')}
          </button> */}
        </div>
      </div>

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
    </div>
  );
};

export default WelcomePage;
