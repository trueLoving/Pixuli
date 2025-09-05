import { useState, useEffect, useCallback } from 'react'
import { useImageStore } from '@/stores/imageStore'
import { Settings, Upload, RefreshCw, Search, Filter, Zap } from 'lucide-react'
import GitHubConfigModal from '@/components/github-config/GitHubConfigModal'
import ImageUpload from '@/components/image-upload/ImageUpload'
import ImageBrowser from '@/components/image-grid/ImageBrowser'
import ImageCompression from '@/components/image-upload/ImageCompression'
import { Toaster } from 'react-hot-toast'
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
  const [showCompression, setShowCompression] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // 使用 useCallback 来稳定函数引用
  const handleLoadImages = useCallback(async () => {
    try {
      await loadImages()
    } catch (error) {
      console.error('Failed to load images:', error)
    }
  }, [loadImages])

  const handleOpenConfigModal = useCallback(() => {
    setShowConfigModal(true)
  }, [])

  const handleCloseConfigModal = useCallback(() => {
    setShowConfigModal(false)
  }, [])

  const handleOpenCompression = useCallback(() => {
    console.log('Opening compression modal, current state:', showCompression)
    setShowCompression(true)
    console.log('State set to true, new state:', true)
  }, [showCompression])

  const handleCloseCompression = useCallback(() => {
    setShowCompression(false)
  }, [])

  // 初始化存储服务
  useEffect(() => {
    if (githubConfig) {
      // 确保存储服务已初始化
      const { initializeStorage } = useImageStore.getState()
      initializeStorage()
      handleLoadImages()
    }
  }, [githubConfig, handleLoadImages])

  // 页面加载时初始化
  useEffect(() => {
    const { githubConfig, initializeStorage } = useImageStore.getState()
    if (githubConfig && !useImageStore.getState().storageService) {
      initializeStorage()
    }
  }, [])

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
      <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center w-full max-w-md">
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Settings className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">欢迎使用 Pixuli</h1>
          <p className="text-gray-600 mb-8 text-lg">专业的图片管理与存储解决方案</p>
          <p className="text-gray-500 mb-6 text-base">请先配置 GitHub 仓库信息以开始使用</p>
          <button
            onClick={handleOpenConfigModal}
            className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 text-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            配置 GitHub
          </button>
        </div>

        {/* GitHub 配置模态框 */}
        <GitHubConfigModal
          isOpen={showConfigModal}
          onClose={handleCloseConfigModal}
        />

        {/* 图片压缩模态框 */}
        {showCompression && (
          <ImageCompression onClose={handleCloseCompression} />
        )}
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">Pixuli</h1>
              <div className="text-sm text-gray-500 hidden sm:block">
                仓库: {githubConfig.owner}/{githubConfig.repo}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleOpenCompression}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                title="图片压缩工具"
              >
                <Zap className="w-5 h-5" />
              </button>
              <button
                onClick={handleOpenConfigModal}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                title="GitHub 配置"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleLoadImages}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                title="刷新图片"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 - 可滚动 */}
      <main className="flex-1 overflow-y-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-red-800">{error}</p>
                <button
                  onClick={clearError}
                  className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* 搜索和过滤区域 */}
          <div className="mb-4 space-y-3">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索图片名称、描述或标签..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              />
            </div>

            {/* 标签过滤 */}
            {allTags.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">按标签筛选:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.length > 0 && (
                    <button
                      onClick={() => setSelectedTags([])}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                    >
                      清除筛选 ({selectedTags.length})
                    </button>
                  )}
                  {allTags.map((tag, index) => (
                    <button
                      key={`app-tag-${index}`}
                      onClick={() => {
                        setSelectedTags(prev => 
                          prev.includes(tag) 
                            ? prev.filter(t => t !== tag)
                            : [...prev, tag]
                        )
                      }}
                      className={`px-3 py-1 text-xs rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
          <div className="mb-4">
            <ImageUpload />
          </div>

          {/* 图片统计和操作区域 */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              图片库 ({filteredImages.length} 张图片)
            </h2>
            {loading && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>正在加载图片...</span>
              </div>
            )}
          </div>

          {/* 图片浏览 */}
          <div className="min-h-0">
            <ImageBrowser images={filteredImages} />
          </div>
          

        </div>
      </main>

      {/* GitHub 配置模态框 */}
      <GitHubConfigModal
        isOpen={showConfigModal}
        onClose={handleCloseConfigModal}
      />

      {/* 图片压缩模态框 */}
      {showCompression && (
        <ImageCompression onClose={handleCloseCompression} />
      )}

      <Toaster />
    </div>
  )
}

export default App