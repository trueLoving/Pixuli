import React, { useState, useEffect } from 'react'
import { GitHubConfig } from '../../types/image'
import { X, Github, Save, Trash2 } from 'lucide-react'
import { showSuccess, showError } from '../../utils/toast'

interface GitHubConfigModalProps {
  isOpen: boolean
  onClose: () => void
  githubConfig?: GitHubConfig | null
  onSaveConfig: (config: GitHubConfig) => void
  onClearConfig: () => void
}

const GitHubConfigModal: React.FC<GitHubConfigModalProps> = ({ 
  isOpen, 
  onClose, 
  githubConfig, 
  onSaveConfig, 
  onClearConfig 
}) => {
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
      showSuccess('GitHub 配置已成功保存！')
      onClose()
    } catch (error) {
      showError(`保存配置失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleInputChange = (field: keyof GitHubConfig, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleClearConfig = () => {
    try {
      onClearConfig()
      showSuccess('GitHub 配置已成功清除！')
      onClose()
    } catch (error) {
      showError(`清除配置失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
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
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Github className="w-6 h-6 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-900">GitHub 配置</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="关闭"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* 表单内容 */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* 仓库所有者 */}
            <div>
              <label htmlFor="owner" className="block text-sm font-medium text-gray-700 mb-2">
                仓库所有者 *
              </label>
              <input
                type="text"
                id="owner"
                value={formData.owner}
                onChange={(e) => handleInputChange('owner', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如: username"
                required
              />
            </div>

            {/* 仓库名称 */}
            <div>
              <label htmlFor="repo" className="block text-sm font-medium text-gray-700 mb-2">
                仓库名称 *
              </label>
              <input
                type="text"
                id="repo"
                value={formData.repo}
                onChange={(e) => handleInputChange('repo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如: my-images"
                required
              />
            </div>

            {/* 分支名称 */}
            <div>
              <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-2">
                分支名称
              </label>
              <input
                type="text"
                id="branch"
                value={formData.branch}
                onChange={(e) => handleInputChange('branch', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如: main"
              />
            </div>

            {/* 访问令牌 */}
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                访问令牌 *
              </label>
              <input
                type="password"
                id="token"
                value={formData.token}
                onChange={(e) => handleInputChange('token', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                需要 GitHub Personal Access Token，权限包括 repo
              </p>
            </div>

            {/* 存储路径 */}
            <div>
              <label htmlFor="path" className="block text-sm font-medium text-gray-700 mb-2">
                存储路径
              </label>
              <input
                type="text"
                id="path"
                value={formData.path}
                onChange={(e) => handleInputChange('path', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如: images"
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClearConfig}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="清除配置"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-medium">清除配置</span>
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span className="text-sm font-medium">保存配置</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default GitHubConfigModal
