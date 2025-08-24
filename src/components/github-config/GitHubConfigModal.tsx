import React, { useState, useEffect } from 'react'
import { GitHubConfig } from '@/type/image'
import { useImageStore } from '@/stores/imageStore'
import { X, Github, Settings, Save, Trash2 } from 'lucide-react'
import { showSuccess, showError, showInfo } from '@/utils/toast'

interface GitHubConfigModalProps {
  isOpen: boolean
  onClose: () => void
}

const GitHubConfigModal: React.FC<GitHubConfigModalProps> = ({ isOpen, onClose }) => {
  const { githubConfig, setGitHubConfig, clearGitHubConfig } = useImageStore()
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
      setGitHubConfig(formData)
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
      clearGitHubConfig()
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

  // 添加键盘事件处理
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
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
              <Github className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">GitHub 仓库配置</h2>
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
                  GitHub 用户名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.owner}
                  onChange={(e) => handleInputChange('owner', e.target.value)}
                  placeholder="您的 GitHub 用户名或组织名"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  仓库名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.repo}
                  onChange={(e) => handleInputChange('repo', e.target.value)}
                  placeholder="用于存储图片的仓库名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分支名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => handleInputChange('branch', e.target.value)}
                  placeholder="通常为 main 或 master"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  图片存储路径 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.path}
                  onChange={(e) => handleInputChange('path', e.target.value)}
                  placeholder="仓库中存储图片的文件夹路径"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Token <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.token}
                  onChange={(e) => handleInputChange('token', e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  需要 repo 权限的 Personal Access Token，用于访问您的仓库
                </p>
              </div>

              {/* 按钮组 */}
              <div className="flex space-x-3 pt-4">
                {githubConfig && (
                  <button
                    type="button"
                    onClick={handleClearConfig}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>清除配置</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Save className="w-4 h-4" />
                  <span>保存配置</span>
                </button>
              </div>
            </form>

            {/* 帮助信息 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h4 className="text-sm font-medium text-blue-800 mb-2">📋 如何获取 GitHub Token？</h4>
              <ol className="text-xs text-blue-700 space-y-1">
                <li>1. 访问 GitHub Settings → Developer settings</li>
                <li>2. 选择 Personal access tokens → Tokens (classic)</li>
                <li>3. 生成新 token，勾选 repo 权限</li>
                <li>4. 复制生成的 token 并粘贴到上方输入框</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default GitHubConfigModal 