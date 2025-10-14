import { Download, Github, Save, Trash2, Upload, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { defaultTranslate } from '../../locales/defaultTranslate'
import type { GitHubConfig } from '../../types/image'
import { showError, showSuccess } from '../../utils/toast'

interface GitHubConfigModalProps {
  isOpen: boolean
  onClose: () => void
  githubConfig?: GitHubConfig | null
  onSaveConfig: (config: GitHubConfig) => void
  onClearConfig: () => void
  platform?: 'web' | 'desktop'
  t?: (key: string) => string
}

const GitHubConfigModal: React.FC<GitHubConfigModalProps> = ({ 
  isOpen, 
  onClose, 
  githubConfig, 
  onSaveConfig, 
  onClearConfig,
  platform = 'web',
  t
}) => {
  // 使用传入的翻译函数或默认中文翻译函数
  const translate = t || defaultTranslate
  const [formData, setFormData] = useState<GitHubConfig>({
    owner: githubConfig?.owner || '',
    repo: githubConfig?.repo || '',
    branch: githubConfig?.branch || 'main',
    token: githubConfig?.token || '',
    path: githubConfig?.path || 'images'
  })
  
  // 当模态框打开时，更新表单数据
  useEffect(() => {
    if (isOpen && githubConfig) {
      setFormData({
        owner: githubConfig.owner || '',
        repo: githubConfig.repo || '',
        branch: githubConfig.branch || 'main',
        token: githubConfig.token || '',
        path: githubConfig.path || 'images'
      })
    }
  }, [isOpen, githubConfig])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      onSaveConfig(formData)
      showSuccess(translate('messages.configSaved'))
      onClose()
    } catch (error) {
      showError(`${translate('messages.saveFailed')}: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleInputChange = (field: keyof GitHubConfig, value: string) => {
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
      if (!githubConfig) {
        showError(translate('messages.noConfigToExport'))
        return
      }

      const configData = {
        version: '1.0',
        platform: platform,
        timestamp: new Date().toISOString(),
        config: githubConfig
      }

      const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `pixuli-github-config-${new Date().toISOString().split('T')[0]}.json`
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
          if (!configData.config || !configData.config.owner || !configData.config.repo || !configData.config.token) {
            showError(translate('messages.invalidFormat'))
            return
          }

          // 更新表单数据
          setFormData({
            owner: configData.config.owner || '',
            repo: configData.config.repo || '',
            branch: configData.config.branch || 'main',
            token: configData.config.token || '',
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


  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // 键盘支持
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  // 如果模态框未打开，不渲染任何内容
  if (!isOpen) {
    return null
  }

  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
        style={{ zIndex: 9998 }}
      />
      
      {/* 模态框内容 */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ zIndex: 9999 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Github className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">{translate('github.config.title')}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              aria-label="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 表单内容 */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {translate('github.config.username')} <span className="text-red-500">{translate('github.config.required')}</span>
                </label>
                <input
                  type="text"
                  value={formData.owner}
                  onChange={(e) => handleInputChange('owner', e.target.value)}
                  placeholder={translate('github.config.usernamePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {translate('github.config.repository')} <span className="text-red-500">{translate('github.config.required')}</span>
                </label>
                <input
                  type="text"
                  value={formData.repo}
                  onChange={(e) => handleInputChange('repo', e.target.value)}
                  placeholder={translate('github.config.repositoryPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {translate('github.config.branch')} <span className="text-red-500">{translate('github.config.required')}</span>
                </label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => handleInputChange('branch', e.target.value)}
                  placeholder={translate('github.config.branchPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {translate('github.config.path')} <span className="text-red-500">{translate('github.config.required')}</span>
                </label>
                <input
                  type="text"
                  value={formData.path}
                  onChange={(e) => handleInputChange('path', e.target.value)}
                  placeholder={translate('github.config.pathPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {translate('github.config.token')} <span className="text-red-500">{translate('github.config.required')}</span>
                </label>
                <input
                  type="password"
                  value={formData.token}
                  onChange={(e) => handleInputChange('token', e.target.value)}
                  placeholder={translate('github.config.tokenPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {translate('github.config.tokenDescription')}
                </p>
              </div>

              {/* 导入导出按钮组 */}
              <div className="flex justify-center space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleImportConfig}
                  className="px-4 py-2 border border-green-300 text-green-700 rounded-md hover:bg-green-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{translate('github.config.import')}</span>
                </button>
                {githubConfig && (
                  <button
                    type="button"
                    onClick={handleExportConfig}
                    className="px-4 py-2 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>{translate('github.config.export')}</span>
                  </button>
                )}
              </div>

              {/* 主要按钮组 */}
              <div className="flex justify-center space-x-3 pt-2">
                {githubConfig && (
                  <button
                    type="button"
                    onClick={handleClearConfig}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{translate('github.config.clearConfig')}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  {translate('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{translate('github.config.saveConfig')}</span>
                </button>
              </div>
            </form>

            {/* 帮助信息 */}
            <div className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 如何获取 GitHub Token */}
                <div className="p-4 bg-blue-50 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800 mb-3">{translate('github.help.tokenGuide.title')}</h4>
                  <ol className="text-xs text-blue-700 space-y-1">
                    <li>{translate('github.help.tokenGuide.step1')}</li>
                    <li>{translate('github.help.tokenGuide.step2')}</li>
                    <li>{translate('github.help.tokenGuide.step3')}</li>
                    <li>{translate('github.help.tokenGuide.step4')}</li>
                  </ol>
                </div>
                
                {/* 配置导入导出 */}
                <div className="p-4 bg-green-50 rounded-md">
                  <h4 className="text-sm font-medium text-green-800 mb-3">{translate('github.help.importExport.title')}</h4>
                  <div className="text-xs text-green-700 space-y-1">
                    <div className="flex items-start">
                      <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      <div>
                        <strong>{translate('github.help.importExport.export')}</strong>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      <div>
                        <strong>{translate('github.help.importExport.import')}</strong>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      <div>
                        <strong>{translate('github.help.importExport.crossPlatform')}</strong>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      <div>
                        <strong>{translate('github.help.importExport.backup')}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default GitHubConfigModal