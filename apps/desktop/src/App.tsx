import AIAnalysisModal from '@/components/ai-analysis/AIAnalysisModal'
import AIModelManager from '@/components/ai-analysis/AIModelManager'
import ImageCompression from '@/components/image-compression/ImageCompression'
import ImageFormatConversion from '@/components/image-format-conversion/ImageFormatConversion'
import { useImageStore } from '@/stores/imageStore'
import {
  COMMON_SHORTCUTS,
  GitHubConfigModal,
  ImageBrowser,
  ImageUpload,
  ImageSearch,
  KeyboardHelpModal,
  SHORTCUT_CATEGORIES,
  formatFileSize,
  getImageDimensionsFromUrl,
  keyboardManager
} from '@packages/ui/src'
import { ArrowRightLeft, HelpCircle, RefreshCw, Settings, Zap, Brain } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
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
  const [showCompression, setShowCompression] = useState(false)
  const [showFormatConversion, setShowFormatConversion] = useState(false)
  const [showAIModelManager, setShowAIModelManager] = useState(false)
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)

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
      name: '功能操作',
      shortcuts: [
        { description: '打开图片压缩工具', key: 'C', ctrlKey: true },
        { description: '打开图片格式转换', key: 'F', ctrlKey: true },
        { description: '打开AI图片分析', key: 'A', ctrlKey: true }
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

  const handleOpenCompression = useCallback(() => {
    console.log('Opening compression modal, current state:', showCompression)
    setShowCompression(true)
    console.log('State set to true, new state:', true)
  }, [showCompression])

  const handleCloseCompression = useCallback(() => {
    setShowCompression(false)
  }, [])

  const handleOpenFormatConversion = useCallback(() => {
    setShowFormatConversion(true)
  }, [])

  const handleCloseFormatConversion = useCallback(() => {
    setShowFormatConversion(false)
  }, [])

  const handleOpenAIModelManager = useCallback(() => {
    setShowAIModelManager(true)
  }, [])

  const handleCloseAIModelManager = useCallback(() => {
    setShowAIModelManager(false)
  }, [])

  const handleOpenAIAnalysis = useCallback(() => {
    setShowAIAnalysis(true)
  }, [])

  const handleCloseAIAnalysis = useCallback(() => {
    setShowAIAnalysis(false)
  }, [])

  const handleOpenKeyboardHelp = useCallback(() => {
    setShowKeyboardHelp(true)
  }, [])

  const handleCloseKeyboardHelp = useCallback(() => {
    setShowKeyboardHelp(false)
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

  // 注册键盘快捷键
  useEffect(() => {
    const shortcuts = [
      // 通用快捷键
      {
        key: COMMON_SHORTCUTS.ESCAPE,
        description: '关闭当前模态框',
        action: () => {
          if (showConfigModal) handleCloseConfigModal()
          else if (showCompression) handleCloseCompression()
          else if (showFormatConversion) handleCloseFormatConversion()
          else if (showAIModelManager) handleCloseAIModelManager()
          else if (showAIAnalysis) handleCloseAIAnalysis()
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
      
      // 功能快捷键
      {
        key: COMMON_SHORTCUTS.C,
        ctrlKey: true,
        description: '打开图片压缩工具',
        action: handleOpenCompression,
        category: SHORTCUT_CATEGORIES.GENERAL
      },
      {
        key: COMMON_SHORTCUTS.F,
        ctrlKey: true,
        description: '打开图片格式转换',
        action: handleOpenFormatConversion,
        category: SHORTCUT_CATEGORIES.GENERAL
      },
      {
        key: COMMON_SHORTCUTS.A,
        ctrlKey: true,
        description: '打开AI图片分析',
        action: handleOpenAIAnalysis,
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
    showConfigModal, showCompression, showFormatConversion, 
    showAIModelManager, showAIAnalysis, showKeyboardHelp,
    handleCloseConfigModal, handleCloseCompression, handleCloseFormatConversion,
    handleCloseAIModelManager, handleCloseAIAnalysis, handleCloseKeyboardHelp,
    handleOpenKeyboardHelp, handleLoadImages, handleOpenCompression,
    handleOpenFormatConversion, handleOpenAIAnalysis, handleOpenConfigModal
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
          githubConfig={githubConfig}
          onSaveConfig={handleSaveConfig}
          onClearConfig={handleClearConfig}
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
                title="图片压缩工具 (Ctrl+C)"
              >
                <Zap className="w-5 h-5" />
              </button>
              <button
                onClick={handleOpenFormatConversion}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                title="图片格式转换 (Ctrl+F)"
              >
                <ArrowRightLeft className="w-5 h-5" />
              </button>
              {/* 发现有问题，先暂时注释掉，等思路梳理清楚功能稳定后再恢复 */}
              <button
                onClick={handleOpenAIAnalysis}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                title="AI 图片分析 (Ctrl+A)"
              >
                <Brain className="w-5 h-5" />
              </button>
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
          <ImageSearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            allTags={allTags}
          />

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

      {/* 图片压缩模态框 */}
      {showCompression && (
        <ImageCompression onClose={handleCloseCompression} />
      )}

      {/* 图片格式转换模态框 */}
      {showFormatConversion && (
        <ImageFormatConversion onClose={handleCloseFormatConversion} />
      )}

      {/* AI 分析模态框 */}
      <AIAnalysisModal
        isOpen={showAIAnalysis}
        onClose={handleCloseAIAnalysis}
        onAnalysisComplete={(result) => {
          console.log('AI 分析完成:', result)
        }}
        onOpenModelManager={handleOpenAIModelManager}
      />

      {/* AI 模型管理模态框 */}
      <AIModelManager
        isOpen={showAIModelManager}
        onClose={handleCloseAIModelManager}
        onModelUpdate={() => {
          // 刷新AI分析模态框中的模型列表
          if (showAIAnalysis) {
            // 触发AI分析模态框重新加载模型
            const event = new CustomEvent('modelListUpdated')
            window.dispatchEvent(event)
          }
        }}
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