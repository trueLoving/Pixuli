import React, { useState, useEffect } from 'react'
import { useImageStore } from '@/stores/imageStore'
import { Settings, Upload, RefreshCw, Search, Filter } from 'lucide-react'
import GitHubConfigModal from '@/components/github-config/GitHubConfigModal'
import ImageUpload from '@/components/image-upload/ImageUpload'
import ImageGrid from '@/components/image-grid/ImageGrid'
import './App.css'

function App() {
  const { 
    images, 
    loading, 
    error, 
    githubConfig, 
    loadImages, 
    clearError 
  } = useImageStore()
  
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  useEffect(() => {
    if (githubConfig) {
      loadImages()
    }
  }, [githubConfig, loadImages])

  // 过滤图片
  const filteredImages = images.filter(image => {
    const matchesSearch = image.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         image.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => image.tags?.includes(tag))
    
    return matchesSearch && matchesTags
  })

  // 获取所有标签
  const allTags = Array.from(new Set(images.flatMap(img => img.tags || [])))

  if (!githubConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Settings className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">欢迎使用 Pixuli</h1>
          <p className="text-gray-600 mb-6">请先配置 GitHub 仓库信息</p>
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            配置 GitHub
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">Pixuli</h1>
              <div className="text-sm text-gray-500">
                {githubConfig.owner}/{githubConfig.repo}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowConfigModal(true)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="GitHub 配置"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={loadImages}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                title="刷新图片"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-red-800">{error}</p>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* 搜索和过滤 */}
        <div className="mb-6 space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索图片名称或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 标签过滤 */}
          {allTags.length > 0 && (
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">标签过滤:</span>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTags(prev => 
                        prev.includes(tag) 
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      )
                    }}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 图片上传区域 */}
        <div className="mb-8">
          <ImageUpload />
        </div>

        {/* 图片统计 */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            图片库 ({filteredImages.length})
          </h2>
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              清除过滤
            </button>
          )}
        </div>

        {/* 图片网格 */}
        <ImageGrid images={filteredImages} />
      </div>

      {/* GitHub 配置模态框 */}
      <GitHubConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />
    </div>
  )
}

export default App