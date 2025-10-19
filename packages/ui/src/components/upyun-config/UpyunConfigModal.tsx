import { Cloud, Download, Save, Trash2, Upload, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { defaultTranslate } from '../../locales/defaultTranslate'
import { showError, showSuccess } from '../../utils/toast'
import type { UpyunConfig } from '../../types/image'
import './UpyunConfigModal.css'


interface UpyunConfigModalProps {
  isOpen: boolean
  onClose: () => void
  upyunConfig?: UpyunConfig | null
  onSaveConfig: (config: UpyunConfig) => void
  onClearConfig: () => void
  platform?: 'web' | 'desktop'
  t?: (key: string) => string
}

const UpyunConfigModal: React.FC<UpyunConfigModalProps> = ({ 
  isOpen, 
  onClose, 
  upyunConfig, 
  onSaveConfig, 
  onClearConfig,
  platform = 'web',
  t
}) => {
  // 使用传入的翻译函数或默认中文翻译函数
  const translate = t || defaultTranslate
  const [formData, setFormData] = useState<UpyunConfig>({
    operator: upyunConfig?.operator || '',
    password: upyunConfig?.password || '',
    bucket: upyunConfig?.bucket || '',
    domain: upyunConfig?.domain || '',
    path: upyunConfig?.path || 'images'
  })
  
  // 当模态框打开时，更新表单数据
  useEffect(() => {
    if (isOpen && upyunConfig) {
      setFormData({
        operator: upyunConfig.operator || '',
        password: upyunConfig.password || '',
        bucket: upyunConfig.bucket || '',
        domain: upyunConfig.domain || '',
        path: upyunConfig.path || 'images'
      })
    } else if (isOpen && !upyunConfig) {
      // 新建配置时重置表单
      setFormData({
        operator: '',
        password: '',
        bucket: '',
        domain: '',
        path: 'images'
      })
    }
  }, [isOpen, upyunConfig])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 检查表单数据是否完整
    if (!formData.operator || !formData.password || !formData.bucket || !formData.domain) {
      showError('请填写所有必填字段')
      return
    }
    
    try {
      onSaveConfig(formData)
      showSuccess('配置保存成功')
      onClose()
    } catch (error) {
      showError(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleInputChange = (field: keyof UpyunConfig, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleClearConfig = () => {
    try {
      onClearConfig()
      showSuccess(translate('messages.configCleared'))
      onClose()
    } catch (error) {
      showError(`${translate('messages.clearFailed')}: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 导出配置
  const handleExportConfig = () => {
    try {
      if (!upyunConfig) {
        showError(translate('messages.noConfigToExport'))
        return
      }

      const configData = {
        version: '1.0',
        platform: platform,
        timestamp: new Date().toISOString(),
        config: upyunConfig
      }

      const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `pixuli-upyun-config-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      showSuccess(translate('messages.configExported'))
    } catch (error) {
      showError(`${translate('messages.exportFailed')}: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 导入配置
  const handleImportConfig = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const configData = JSON.parse(content)

          // 验证配置格式
          if (!configData.config || !configData.config.operator || !configData.config.bucket) {
            showError(translate('messages.invalidFormat'))
            return
          }

          // 更新表单数据
          setFormData({
            operator: configData.config.operator || '',
            password: configData.config.password || '',
            bucket: configData.config.bucket || '',
            domain: configData.config.domain || '',
            path: configData.config.path || 'images'
          })

          showSuccess(translate('messages.configImported'))
        } catch (error) {
          showError(`${translate('messages.importFailed')}: ${error instanceof Error ? error.message : '文件格式错误'}`)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  if (!isOpen) return null

  return (
    <div className="upyun-config-modal-overlay">
      <div className="upyun-config-modal-container">
        <div className="upyun-config-modal-content">
          {/* 头部 */}
          <div className="upyun-config-modal-header">
            <div className="upyun-config-modal-title">
              <Cloud className="upyun-config-modal-title-icon" />
              <h2 className="upyun-config-modal-title-text">
                又拍云存储配置
              </h2>
            </div>
            <button
              onClick={onClose}
              className="upyun-config-modal-close"
            >
              <X className="upyun-config-modal-close-icon" />
            </button>
          </div>

          {/* 操作按钮 */}
          <div className="upyun-config-modal-actions">
            <div className="upyun-config-modal-actions-left">
              <button
                onClick={handleImportConfig}
                className="upyun-config-modal-action-button"
                title="导入配置"
              >
                <Upload className="w-4 h-4" />
                <span>导入</span>
              </button>
              {upyunConfig && (
                <button
                  onClick={handleExportConfig}
                  className="upyun-config-modal-action-button"
                  title="导出配置"
                >
                  <Download className="w-4 h-4" />
                  <span>导出</span>
                </button>
              )}
            </div>
            <div className="upyun-config-modal-actions-right">
              {upyunConfig && (
                <button
                  onClick={handleClearConfig}
                  className="upyun-config-modal-action-button upyun-config-modal-action-button-danger"
                  title="清除配置"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>清除配置</span>
                </button>
              )}
            </div>
          </div>

          {/* 表单内容 */}
          <div className="upyun-config-modal-body">
            <form onSubmit={handleSubmit} className="upyun-config-form">
              {/* 又拍云配置 */}
              <div className="upyun-config-form-section">
                <div className="upyun-config-form-row">
                  <div className="upyun-config-form-group">
                    <label className="upyun-config-form-label">
                      操作员 <span className="upyun-config-form-required">{translate('github.config.required')}</span>
                    </label>
                    <input
                      type="text"
                      value={formData.operator}
                      onChange={(e) => handleInputChange('operator', e.target.value)}
                      placeholder="请输入又拍云操作员名称"
                      className="upyun-config-form-input"
                      required
                    />
                  </div>
                  
                  <div className="upyun-config-form-group">
                    <label className="upyun-config-form-label">
                      密码 <span className="upyun-config-form-required">{translate('github.config.required')}</span>
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="请输入又拍云操作员密码"
                      className="upyun-config-form-input"
                      required
                    />
                  </div>
                </div>

                <div className="upyun-config-form-row">
                  <div className="upyun-config-form-group">
                    <label className="upyun-config-form-label">
                      存储空间 <span className="upyun-config-form-required">{translate('github.config.required')}</span>
                    </label>
                    <input
                      type="text"
                      value={formData.bucket}
                      onChange={(e) => handleInputChange('bucket', e.target.value)}
                      placeholder="请输入存储空间名称"
                      className="upyun-config-form-input"
                      required
                    />
                  </div>
                  
                  <div className="upyun-config-form-group">
                    <label className="upyun-config-form-label">
                      访问域名 <span className="upyun-config-form-required">{translate('github.config.required')}</span>
                    </label>
                    <input
                      type="text"
                      value={formData.domain}
                      onChange={(e) => handleInputChange('domain', e.target.value)}
                      placeholder="请输入访问域名"
                      className="upyun-config-form-input"
                      required
                    />
                  </div>
                </div>

                <div className="upyun-config-form-row">
                  <div className="upyun-config-form-group">
                    <label className="upyun-config-form-label">
                      存储路径
                    </label>
                    <input
                      type="text"
                      value={formData.path}
                      onChange={(e) => handleInputChange('path', e.target.value)}
                      placeholder="请输入存储路径"
                      className="upyun-config-form-input"
                    />
                  </div>
                </div>
              </div>

              {/* 帮助信息 */}
              <div className="upyun-config-form-section">
                <h3 className="upyun-config-form-section-title">
                  配置帮助
                </h3>
                
                <div className="upyun-config-help">
                  <div className="upyun-config-help-item">
                    <h4 className="upyun-config-help-item-title">
                      📋 如何获取又拍云凭证？
                    </h4>
                    <ul className="upyun-config-help-item-list">
                      <li>1. 登录又拍云控制台</li>
                      <li>2. 进入"服务管理" → "云存储"</li>
                      <li>3. 创建或选择存储空间</li>
                      <li>4. 在"操作员管理"中创建操作员</li>
                      <li>5. 获取操作员名称和密码</li>
                    </ul>
                  </div>
                  
                  <div className="upyun-config-help-item">
                    <h4 className="upyun-config-help-item-title">
                      🔄 配置导入/导出
                    </h4>
                    <ul className="upyun-config-help-item-list">
                      <li>导出：将当前配置保存为 JSON 文件</li>
                      <li>导入：从 JSON 文件加载配置</li>
                      <li>跨平台：支持桌面端和 Web 端配置互导</li>
                      <li>备份：建议定期导出配置作为备份</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 表单操作 */}
              <div className="upyun-config-form-actions">
                <button
                  type="button"
                  onClick={onClose}
                  className="upyun-config-form-cancel-button"
                >
                  {translate('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="upyun-config-form-save-button"
                >
                  <Save className="w-4 h-4" />
                  <span>保存配置</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UpyunConfigModal
