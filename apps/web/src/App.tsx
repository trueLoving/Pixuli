import { useState, useEffect, useCallback } from 'react'
import { useImageStore } from '@/stores/imageStore'
import { Settings, RefreshCw, Search, Filter, HelpCircle, Play } from 'lucide-react'
import { 
  GitHubConfigModal,
  ImageUpload,
  ImageBrowser,
  KeyboardHelpModal,
  keyboardManager,
  COMMON_SHORTCUTS,
  SHORTCUT_CATEGORIES,
  getImageDimensionsFromUrl,
  formatFileSize
} from '@packages/ui/src'
import { Toaster } from 'react-hot-toast'
import { isDemoEnvironment, setDemoMode, getDemoConfig, getAppConfig } from '@/utils/env'
import './App.css'

function App() {
  const { 
    images, 
    loading, 
    error, 
    githubConfig, 
    loadImages, 
    clearError,
    setGitHubConfig,
    clearGitHubConfig,
    uploadImage,
    uploadMultipleImages,
    batchUploadProgress,
    deleteImage,
    updateImage
  } = useImageStore()
  
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)

  // 键盘快捷键分类数据
  const keyboardCategories = [
    {
      name: '通用操作',
      shortcuts: [
        { description: '关闭当前模态框', key: 'Escape' },
        { description: '显示键盘快捷键帮助', key: 'F1' },
        { description: '刷新图片列表', key: 'F5' },
        { description: '打开GitHub配置', key: ',', ctrlKey: true },
        { description: '聚焦搜索框', key: '/' },
        { description: '切换视图模式', key: 'V', ctrlKey: true }
      ]
    },
    {
      name: '图片浏览',
      shortcuts: [
        { description: '选择上一张图片', key: 'ArrowUp' },
        { description: '选择下一张图片', key: 'ArrowDown' },
        { description: '选择左侧图片', key: 'ArrowLeft' },
        { description: '选择右侧图片', key: 'ArrowRight' },
        { description: '打开选中的图片', key: 'Enter' }
      ]
    }
  ]

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

  const handleSaveConfig = useCallback((config: any) => {
    setGitHubConfig(config)
    setShowConfigModal(false)
  }, [setGitHubConfig])

  const handleClearConfig = useCallback(() => {
    clearGitHubConfig()
    setShowConfigModal(false)
  }, [clearGitHubConfig])

  // CRUD 操作回调函数
  const handleDeleteImage = useCallback(async (imageId: string, fileName: string) => {
    await deleteImage(imageId, fileName)
  }, [deleteImage])

  const handleUpdateImage = useCallback(async (data: any) => {
    await updateImage(data)
  }, [updateImage])

  const handleOpenKeyboardHelp = useCallback(() => {
    setShowKeyboardHelp(true)
  }, [])

  const handleCloseKeyboardHelp = useCallback(() => {
    setShowKeyboardHelp(false)
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

  // 检测演示环境
  useEffect(() => {
    const demoMode = isDemoEnvironment()
    setIsDemoMode(demoMode)
  }, [])

  // 注册键盘快捷键
  useEffect(() => {
    const shortcuts = [
      // 通用快捷键
      {
        key: COMMON_SHORTCUTS.ESCAPE,
        description: '关闭当前模态框',
        action: () => {
          if (showConfigModal) handleCloseConfigModal()
          else if (showKeyboardHelp) handleCloseKeyboardHelp()
        },
        category: SHORTCUT_CATEGORIES.GENERAL
      },
      {
        key: COMMON_SHORTCUTS.F1,
        description: '显示键盘快捷键帮助',
        action: handleOpenKeyboardHelp,
        category: SHORTCUT_CATEGORIES.HELP
      },
      {
        key: COMMON_SHORTCUTS.F5,
        description: '刷新图片列表',
        action: handleLoadImages,
        category: SHORTCUT_CATEGORIES.GENERAL
      },
      
      {
        key: COMMON_SHORTCUTS.COMMA,
        ctrlKey: true,
        description: '打开GitHub配置',
        action: handleOpenConfigModal,
        category: SHORTCUT_CATEGORIES.GENERAL
      },
      
      // 搜索快捷键
      {
        key: COMMON_SHORTCUTS.SLASH,
        description: '聚焦搜索框',
        action: () => {
          const searchInput = document.querySelector('input[placeholder*="搜索"]') as HTMLInputElement
          if (searchInput) {
            searchInput.focus()
            searchInput.select()
          }
        },
        category: SHORTCUT_CATEGORIES.SEARCH
      },
      {
        key: COMMON_SHORTCUTS.V,
        ctrlKey: true,
        description: '切换视图模式',
        action: () => {
          // 触发图片浏览器的视图切换
          const event = new CustomEvent('toggleViewMode')
          window.dispatchEvent(event)
        },
        category: SHORTCUT_CATEGORIES.IMAGE_BROWSER
      }
    ]

    keyboardManager.registerBatch(shortcuts)

    return () => {
      shortcuts.forEach(shortcut => keyboardManager.unregister(shortcut))
    }
  }, [
    showConfigModal, showKeyboardHelp,
    handleCloseConfigModal, handleCloseKeyboardHelp,
    handleOpenKeyboardHelp, handleLoadImages, handleOpenConfigModal
  ])

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
          <h1 className="text-3xl font-bold text-gray-900 mb-3">欢迎使用 {getAppConfig().name}</h1>
          <p className="text-gray-600 mb-8 text-lg">{getAppConfig().description}</p>
          
          {isDemoMode && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Play className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-purple-800">演示环境</h3>
              </div>
              <p className="text-purple-700 text-sm mb-3">
                您正在使用演示环境，可以下载预配置的演示配置文件快速体验 Pixuli 的各项功能。
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    const demoConfig = getDemoConfig()
                    const blob = new Blob([JSON.stringify(demoConfig, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = 'pixuli-github-config-demo.json'
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    URL.revokeObjectURL(url)
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>下载演示配置</span>
                </button>
                <button
                  onClick={() => {
                    setDemoMode(false)
                    setIsDemoMode(false)
                  }}
                  className="px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  退出演示模式
                </button>
              </div>
            </div>
          )}
          
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
          githubConfig={githubConfig}
          onSaveConfig={handleSaveConfig}
          onClearConfig={handleClearConfig}
        />
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
              <h1 className="text-xl font-bold text-gray-900">{getAppConfig().name}</h1>
              <div className="text-sm text-gray-500 hidden sm:block">
                仓库: {githubConfig.owner}/{githubConfig.repo}
              </div>
              {isDemoMode && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  <Play className="w-3 h-3" />
                  <span>演示环境</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleOpenConfigModal}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                title="GitHub 配置 (Ctrl+,)"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleLoadImages}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                title="刷新图片 (F5)"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleOpenKeyboardHelp}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                title="键盘快捷键帮助 (F1)"
              >
                <HelpCircle className="w-5 h-5" />
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
            <ImageUpload 
              onUploadImage={uploadImage}
              onUploadMultipleImages={uploadMultipleImages}
              loading={loading}
              batchUploadProgress={batchUploadProgress}
            />
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
            <ImageBrowser 
              images={filteredImages}
              onDeleteImage={handleDeleteImage}
              onUpdateImage={handleUpdateImage}
              getImageDimensionsFromUrl={getImageDimensionsFromUrl}
              formatFileSize={formatFileSize}
            />
          </div>
          

        </div>
      </main>

      {/* GitHub 配置模态框 */}
      <GitHubConfigModal
        isOpen={showConfigModal}
        onClose={handleCloseConfigModal}
        githubConfig={githubConfig}
        onSaveConfig={handleSaveConfig}
        onClearConfig={handleClearConfig}
      />

      {/* 键盘快捷键帮助模态框 */}
      <KeyboardHelpModal
        isOpen={showKeyboardHelp}
        onClose={handleCloseKeyboardHelp}
        categories={keyboardCategories}
      />

      <Toaster />
    </div>
  )
}

export default App