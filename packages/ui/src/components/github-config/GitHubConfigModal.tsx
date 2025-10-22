import { Download, Github, Save, Trash2, Upload, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { defaultTranslate } from '../../locales/defaultTranslate';
import type { GitHubConfig } from '../../types/github';
import { showError, showSuccess } from '../../utils/toast';
import './GitHubConfigModal.css';

interface GitHubConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  githubConfig?: GitHubConfig | null;
  onSaveConfig: (config: GitHubConfig) => void;
  onClearConfig: () => void;
  platform?: 'web' | 'desktop';
  t?: (key: string) => string;
}

const GitHubConfigModal: React.FC<GitHubConfigModalProps> = ({
  isOpen,
  onClose,
  githubConfig,
  onSaveConfig,
  onClearConfig,
  platform = 'web',
  t,
}) => {
  // 使用传入的翻译函数或默认中文翻译函数
  const translate = t || defaultTranslate;
  const [formData, setFormData] = useState<GitHubConfig>({
    owner: githubConfig?.owner || '',
    repo: githubConfig?.repo || '',
    branch: githubConfig?.branch || 'main',
    token: githubConfig?.token || '',
    path: githubConfig?.path || 'images',
  });

  // 当模态框打开时，更新表单数据
  useEffect(() => {
    if (isOpen && githubConfig) {
      setFormData({
        owner: githubConfig.owner || '',
        repo: githubConfig.repo || '',
        branch: githubConfig.branch || 'main',
        token: githubConfig.token || '',
        path: githubConfig.path || 'images',
      });
    }
  }, [isOpen, githubConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      onSaveConfig(formData);
      showSuccess(translate('messages.configSaved'));
      onClose();
    } catch (error) {
      showError(
        `${translate('messages.saveFailed')}: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  };

  const handleInputChange = (field: keyof GitHubConfig, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClearConfig = () => {
    try {
      onClearConfig();
      showSuccess(translate('messages.configCleared'));
      onClose();
    } catch (error) {
      showError(
        `${translate('messages.clearFailed')}: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  };

  // 导出配置
  const handleExportConfig = () => {
    try {
      if (!githubConfig) {
        showError(translate('messages.noConfigToExport'));
        return;
      }

      const configData = {
        version: '1.0',
        platform: platform,
        timestamp: new Date().toISOString(),
        config: githubConfig,
      };

      const blob = new Blob([JSON.stringify(configData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pixuli-github-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess(translate('messages.configExported'));
    } catch (error) {
      showError(
        `${translate('messages.exportFailed')}: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  };

  // 导入配置
  const handleImportConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = e => {
        try {
          const content = e.target?.result as string;
          const configData = JSON.parse(content);

          // 验证配置格式
          if (
            !configData.config ||
            !configData.config.owner ||
            !configData.config.repo ||
            !configData.config.token
          ) {
            showError(translate('messages.invalidFormat'));
            return;
          }

          // 更新表单数据
          setFormData({
            owner: configData.config.owner || '',
            repo: configData.config.repo || '',
            branch: configData.config.branch || 'main',
            token: configData.config.token || '',
            path: configData.config.path || 'images',
          });

          showSuccess(translate('messages.configImported'));
        } catch (error) {
          showError(
            `${translate('messages.importFailed')}: ${error instanceof Error ? error.message : '文件格式错误'}`
          );
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // 键盘支持
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // 如果模态框未打开，不渲染任何内容
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="github-config-modal-overlay"
        onClick={onClose}
        style={{ zIndex: 9998 }}
      />

      {/* 模态框内容 */}
      <div
        className="github-config-modal-container"
        style={{ zIndex: 9999 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="github-config-modal-content">
          {/* 头部 */}
          <div className="github-config-modal-header">
            <div className="github-config-modal-title">
              <Github className="github-config-modal-title-icon" />
              <h2 className="github-config-modal-title-text">
                {translate('github.config.title')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="github-config-modal-close"
              aria-label="关闭"
            >
              <X className="github-config-modal-close-icon" />
            </button>
          </div>

          {/* 操作按钮 */}
          <div className="github-config-modal-actions">
            <div className="github-config-modal-actions-left">
              <button
                onClick={handleImportConfig}
                className="github-config-modal-action-button"
                title={translate('github.help.importExport.import')}
              >
                <Upload className="w-4 h-4" />
                <span>{translate('github.config.import')}</span>
              </button>
              {githubConfig && (
                <button
                  onClick={handleExportConfig}
                  className="github-config-modal-action-button"
                  title={translate('github.help.importExport.export')}
                >
                  <Download className="w-4 h-4" />
                  <span>{translate('github.config.export')}</span>
                </button>
              )}
            </div>
            <div className="github-config-modal-actions-right">
              {githubConfig && (
                <button
                  onClick={handleClearConfig}
                  className="github-config-modal-action-button github-config-modal-action-button-danger"
                  title={translate('github.config.clearConfig')}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{translate('github.config.clearConfig')}</span>
                </button>
              )}
            </div>
          </div>

          {/* 表单内容 */}
          <div className="github-config-modal-body">
            <form onSubmit={handleSubmit} className="github-config-form">
              {/* GitHub 配置 */}
              <div className="github-config-form-section">
                <h3 className="github-config-form-section-title">
                  GitHub {translate('storage.configuration')}
                </h3>

                <div className="github-config-form-row">
                  <div className="github-config-form-group">
                    <label className="github-config-form-label">
                      {translate('github.config.username')}{' '}
                      <span className="github-config-form-required">
                        {translate('github.config.required')}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.owner}
                      onChange={e => handleInputChange('owner', e.target.value)}
                      placeholder={translate(
                        'github.config.usernamePlaceholder'
                      )}
                      className="github-config-form-input"
                      required
                    />
                  </div>

                  <div className="github-config-form-group">
                    <label className="github-config-form-label">
                      {translate('github.config.repository')}{' '}
                      <span className="github-config-form-required">
                        {translate('github.config.required')}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.repo}
                      onChange={e => handleInputChange('repo', e.target.value)}
                      placeholder={translate(
                        'github.config.repositoryPlaceholder'
                      )}
                      className="github-config-form-input"
                      required
                    />
                  </div>
                </div>

                <div className="github-config-form-row">
                  <div className="github-config-form-group">
                    <label className="github-config-form-label">
                      {translate('github.config.branch')}{' '}
                      <span className="github-config-form-required">
                        {translate('github.config.required')}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.branch}
                      onChange={e =>
                        handleInputChange('branch', e.target.value)
                      }
                      placeholder={translate('github.config.branchPlaceholder')}
                      className="github-config-form-input"
                      required
                    />
                  </div>

                  <div className="github-config-form-group">
                    <label className="github-config-form-label">
                      {translate('github.config.path')}{' '}
                      <span className="github-config-form-required">
                        {translate('github.config.required')}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.path}
                      onChange={e => handleInputChange('path', e.target.value)}
                      placeholder={translate('github.config.pathPlaceholder')}
                      className="github-config-form-input"
                      required
                    />
                  </div>
                </div>

                <div className="github-config-form-group">
                  <label className="github-config-form-label">
                    {translate('github.config.token')}{' '}
                    <span className="github-config-form-required">
                      {translate('github.config.required')}
                    </span>
                  </label>
                  <input
                    type="password"
                    value={formData.token}
                    onChange={e => handleInputChange('token', e.target.value)}
                    placeholder={translate('github.config.tokenPlaceholder')}
                    className="github-config-form-input"
                    required
                  />
                  <p className="github-config-form-description">
                    {translate('github.config.tokenDescription')}
                  </p>
                </div>
              </div>

              {/* 帮助信息 */}
              <div className="github-config-form-section">
                <h3 className="github-config-form-section-title">
                  {translate('github.help.title')}
                </h3>

                <div className="github-config-help">
                  <div className="github-config-help-item">
                    <h4 className="github-config-help-item-title">
                      📋 {translate('github.help.tokenGuide.title')}
                    </h4>
                    <ul className="github-config-help-item-list">
                      <li>{translate('github.help.tokenGuide.step1')}</li>
                      <li>{translate('github.help.tokenGuide.step2')}</li>
                      <li>{translate('github.help.tokenGuide.step3')}</li>
                      <li>{translate('github.help.tokenGuide.step4')}</li>
                    </ul>
                  </div>

                  <div className="github-config-help-item">
                    <h4 className="github-config-help-item-title">
                      🔄 {translate('github.help.importExport.title')}
                    </h4>
                    <ul className="github-config-help-item-list">
                      <li>{translate('github.help.importExport.export')}</li>
                      <li>{translate('github.help.importExport.import')}</li>
                      <li>
                        {translate('github.help.importExport.crossPlatform')}
                      </li>
                      <li>{translate('github.help.importExport.backup')}</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 表单操作 */}
              <div className="github-config-form-actions">
                <button
                  type="button"
                  onClick={onClose}
                  className="github-config-form-cancel-button"
                >
                  {translate('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="github-config-form-save-button"
                >
                  <Save className="w-4 h-4" />
                  <span>{translate('github.config.saveConfig')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default GitHubConfigModal;
