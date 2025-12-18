import { Download, Save, Trash2, Upload, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { defaultTranslate } from '../../../../locales';
import type { GiteeConfig } from '../../../../types/gitee';
import { showError, showSuccess } from '../../../../utils/toast';
import './GiteeConfigModal.css';

interface GiteeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  giteeConfig?: GiteeConfig | null;
  onSaveConfig: (config: GiteeConfig) => void;
  onClearConfig: () => void;
  platform?: 'web' | 'desktop';
  t?: (key: string) => string;
}

const GiteeConfigModal: React.FC<GiteeConfigModalProps> = ({
  isOpen,
  onClose,
  giteeConfig,
  onSaveConfig,
  onClearConfig,
  platform = 'web',
  t,
}) => {
  // 使用传入的翻译函数或默认中文翻译函数
  const translate = t || defaultTranslate;
  const [formData, setFormData] = useState<GiteeConfig>({
    owner: giteeConfig?.owner || '',
    repo: giteeConfig?.repo || '',
    branch: giteeConfig?.branch || 'main',
    token: giteeConfig?.token || '',
    path: giteeConfig?.path || 'images',
  });

  // 当模态框打开时，更新表单数据
  useEffect(() => {
    if (isOpen) {
      if (giteeConfig) {
        // 有配置时，填充表单数据
        setFormData({
          owner: giteeConfig.owner || '',
          repo: giteeConfig.repo || '',
          branch: giteeConfig.branch || 'main',
          token: giteeConfig.token || '',
          path: giteeConfig.path || 'images',
        });
      } else {
        // 配置被清除后，重置表单数据为空
        setFormData({
          owner: '',
          repo: '',
          branch: 'main',
          token: '',
          path: 'images',
        });
      }
    }
  }, [isOpen, giteeConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      onSaveConfig(formData);
      showSuccess(translate('messages.configSaved'));
      onClose();
    } catch (error) {
      showError(
        `${translate('messages.saveFailed')}: ${error instanceof Error ? error.message : translate('messages.unknownError')}`,
      );
    }
  };

  const handleInputChange = (field: keyof GiteeConfig, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClearConfig = () => {
    try {
      onClearConfig();
      showSuccess(translate('messages.configCleared'));
      onClose();
    } catch (error) {
      showError(
        `${translate('messages.clearFailed')}: ${error instanceof Error ? error.message : translate('messages.unknownError')}`,
      );
    }
  };

  // 导出配置
  const handleExportConfig = () => {
    try {
      if (!giteeConfig) {
        showError(translate('messages.noConfigToExport'));
        return;
      }

      const configData = {
        version: '1.0',
        platform: platform,
        timestamp: new Date().toISOString(),
        config: giteeConfig,
      };

      const blob = new Blob([JSON.stringify(configData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pixuli-gitee-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess(translate('messages.configExported'));
    } catch (error) {
      showError(
        `${translate('messages.exportFailed')}: ${error instanceof Error ? error.message : translate('messages.unknownError')}`,
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
            `${translate('messages.importFailed')}: ${error instanceof Error ? error.message : translate('messages.fileFormatError')}`,
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
        className="gitee-config-modal-overlay"
        onClick={onClose}
        style={{ zIndex: 9998 }}
      />

      {/* 模态框内容 */}
      <div
        className="gitee-config-modal-container"
        style={{ zIndex: 9999 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="gitee-config-modal-content">
          {/* 头部 */}
          <div className="gitee-config-modal-header">
            <div className="gitee-config-modal-title">
              <span className="gitee-config-modal-title-icon">码云</span>
              <h2 className="gitee-config-modal-title-text">
                {translate('gitee.config.title')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="gitee-config-modal-close"
              aria-label={translate('gitee.config.close')}
            >
              <X className="gitee-config-modal-close-icon" />
            </button>
          </div>

          {/* 操作按钮 */}
          <div className="gitee-config-modal-actions">
            <div className="gitee-config-modal-actions-left">
              <button
                onClick={handleImportConfig}
                className="gitee-config-modal-action-button"
                title={translate('gitee.config.import')}
              >
                <Upload className="w-4 h-4" />
                <span>{translate('gitee.config.import')}</span>
              </button>
              {giteeConfig && (
                <button
                  onClick={handleExportConfig}
                  className="gitee-config-modal-action-button"
                  title={translate('gitee.config.export')}
                >
                  <Download className="w-4 h-4" />
                  <span>{translate('gitee.config.export')}</span>
                </button>
              )}
            </div>
            <div className="gitee-config-modal-actions-right">
              {giteeConfig && (
                <button
                  onClick={handleClearConfig}
                  className="gitee-config-modal-action-button gitee-config-modal-action-button-danger"
                  title={translate('gitee.config.clearConfig')}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{translate('gitee.config.clearConfig')}</span>
                </button>
              )}
            </div>
          </div>

          {/* 表单内容 */}
          <div className="gitee-config-modal-body">
            <form onSubmit={handleSubmit} className="gitee-config-form">
              {/* Gitee 配置 */}
              <div className="gitee-config-form-section">
                <h3 className="gitee-config-form-section-title">
                  Gitee {translate('storage.configuration')}
                </h3>

                <div className="gitee-config-form-row">
                  <div className="gitee-config-form-group">
                    <label className="gitee-config-form-label">
                      {translate('gitee.config.username')}{' '}
                      <span className="gitee-config-form-required">
                        {translate('gitee.config.required')}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.owner}
                      onChange={e => handleInputChange('owner', e.target.value)}
                      placeholder={translate(
                        'gitee.config.usernamePlaceholder',
                      )}
                      className="gitee-config-form-input"
                      required
                    />
                  </div>

                  <div className="gitee-config-form-group">
                    <label className="gitee-config-form-label">
                      {translate('gitee.config.repository')}{' '}
                      <span className="gitee-config-form-required">
                        {translate('gitee.config.required')}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.repo}
                      onChange={e => handleInputChange('repo', e.target.value)}
                      placeholder={translate(
                        'gitee.config.repositoryPlaceholder',
                      )}
                      className="gitee-config-form-input"
                      required
                    />
                  </div>
                </div>

                <div className="gitee-config-form-row">
                  <div className="gitee-config-form-group">
                    <label className="gitee-config-form-label">
                      {translate('gitee.config.branch')}{' '}
                      <span className="gitee-config-form-required">
                        {translate('gitee.config.required')}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.branch}
                      onChange={e =>
                        handleInputChange('branch', e.target.value)
                      }
                      placeholder={translate('gitee.config.branchPlaceholder')}
                      className="gitee-config-form-input"
                      required
                    />
                  </div>

                  <div className="gitee-config-form-group">
                    <label className="gitee-config-form-label">
                      {translate('gitee.config.path')}{' '}
                      <span className="gitee-config-form-required">
                        {translate('gitee.config.required')}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.path}
                      onChange={e => handleInputChange('path', e.target.value)}
                      placeholder={translate('gitee.config.pathPlaceholder')}
                      className="gitee-config-form-input"
                      required
                    />
                  </div>
                </div>

                <div className="gitee-config-form-group">
                  <label className="gitee-config-form-label">
                    {translate('gitee.config.token')}{' '}
                    <span className="gitee-config-form-required">
                      {translate('gitee.config.required')}
                    </span>
                  </label>
                  <input
                    type="password"
                    value={formData.token}
                    onChange={e => handleInputChange('token', e.target.value)}
                    placeholder={translate('gitee.config.tokenPlaceholder')}
                    className="gitee-config-form-input"
                    required
                  />
                  <p className="gitee-config-form-description">
                    {translate('gitee.config.tokenDescription')}
                  </p>
                </div>
              </div>

              {/* 帮助信息 */}
              <div className="gitee-config-form-section">
                <h3 className="gitee-config-form-section-title">
                  {translate('gitee.help.title')}
                </h3>

                <div className="gitee-config-help">
                  <div className="gitee-config-help-item">
                    <h4 className="gitee-config-help-item-title">
                      {translate('gitee.help.tokenGuide.title')}
                    </h4>
                    <ul className="gitee-config-help-item-list">
                      <li>{translate('gitee.help.tokenGuide.step1')}</li>
                      <li>{translate('gitee.help.tokenGuide.step2')}</li>
                      <li>{translate('gitee.help.tokenGuide.step3')}</li>
                      <li>{translate('gitee.help.tokenGuide.step4')}</li>
                      <li>{translate('gitee.help.tokenGuide.step5')}</li>
                    </ul>
                  </div>

                  <div className="gitee-config-help-item">
                    <h4 className="gitee-config-help-item-title">
                      {translate('gitee.help.importExport.title')}
                    </h4>
                    <ul className="gitee-config-help-item-list">
                      <li>{translate('gitee.help.importExport.export')}</li>
                      <li>{translate('gitee.help.importExport.import')}</li>
                      <li>
                        {translate('gitee.help.importExport.crossPlatform')}
                      </li>
                      <li>{translate('gitee.help.importExport.backup')}</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 表单操作 */}
              <div className="gitee-config-form-actions">
                <button
                  type="button"
                  onClick={onClose}
                  className="gitee-config-form-cancel-button"
                >
                  {translate('common.cancel')}
                </button>
                <button type="submit" className="gitee-config-form-save-button">
                  <Save className="w-4 h-4" />
                  <span>{translate('gitee.config.saveConfig')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default GiteeConfigModal;
