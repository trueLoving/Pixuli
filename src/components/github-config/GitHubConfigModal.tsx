import React, { useState } from 'react'
import { GitHubConfig } from '@/type/image'
import { useImageStore } from '@/stores/imageStore'
import { X, Github, Settings, Save } from 'lucide-react'

interface GitHubConfigModalProps {
  isOpen: boolean
  onClose: () => void
}

const GitHubConfigModal: React.FC<GitHubConfigModalProps> = ({ isOpen, onClose }) => {
  const { githubConfig, setGitHubConfig } = useImageStore()
  const [formData, setFormData] = useState<GitHubConfig>({
    owner: githubConfig?.owner || '',
    repo: githubConfig?.repo || '',
    branch: githubConfig?.branch || 'main',
    token: githubConfig?.token || '',
    path: githubConfig?.path || 'images'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setGitHubConfig(formData)
    onClose()
  }

  const handleInputChange = (field: keyof GitHubConfig, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Github className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">GitHub 配置</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              仓库所有者
            </label>
            <input
              type="text"
              value={formData.owner}
              onChange={(e) => handleInputChange('owner', e.target.value)}
              placeholder="用户名或组织名"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              仓库名称
            </label>
            <input
              type="text"
              value={formData.repo}
              onChange={(e) => handleInputChange('repo', e.target.value)}
              placeholder="仓库名"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分支名称
            </label>
            <input
              type="text"
              value={formData.branch}
              onChange={(e) => handleInputChange('branch', e.target.value)}
              placeholder="main"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              图片存储路径
            </label>
            <input
              type="text"
              value={formData.path}
              onChange={(e) => handleInputChange('path', e.target.value)}
              placeholder="images"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GitHub Token
            </label>
            <input
              type="password"
              value={formData.token}
              onChange={(e) => handleInputChange('token', e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              需要 repo 权限的 Personal Access Token
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>保存配置</span>
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">如何获取 GitHub Token？</h4>
          <ol className="text-xs text-blue-700 space-y-1">
            <li>1. 访问 GitHub Settings → Developer settings</li>
            <li>2. 选择 Personal access tokens → Tokens (classic)</li>
            <li>3. 生成新 token，勾选 repo 权限</li>
            <li>4. 复制生成的 token</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default GitHubConfigModal 