import { useState, useEffect, useCallback } from 'react'
import { useImageStore } from '@/stores/imageStore'
import { Settings, RefreshCw, HelpCircle, Play } from 'lucide-react'
import { 
  GitHubConfigModal,
  ImageUpload,
  ImageBrowser,
  ImageSearch,
  KeyboardHelpModal,
  keyboardManager,
  COMMON_SHORTCUTS,
  SHORTCUT_CATEGORIES,
  getImageDimensionsFromUrl,
  formatFileSize
} from '@packages/ui/src'
import { AppThemeProvider } from './hooks/useAppTheme'
// import AppThemeToggle from './components/AppThemeToggle'
import './components/AppThemeToggle.css'
import { Toaster } from 'react-hot-toast'
import { isDemoEnvironment, setDemoMode, getDemoConfig } from '@/utils/env'
import LanguageSwitcher from './components/LanguageSwitcher'
import { useI18n } from './hooks/useI18n'
import './App.css'

function App() {
  const { t } = useI18n()
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
      name: t('keyboard.categories.general'),
      shortcuts: [
        { description: t('keyboard.shortcuts.closeModal'), key: 'Escape' },
        { description: t('keyboard.shortcuts.showHelp'), key: 'F1' },
        { description: t('keyboard.shortcuts.refresh'), key: 'F5' },
        { description: t('keyboard.shortcuts.openConfig'), key: ',', ctrlKey: true },
        { description: t('keyboard.shortcuts.focusSearch'), key: '/' },
        { description: t('keyboard.shortcuts.toggleView'), key: 'V', ctrlKey: true }
      ]
    },
    {
      name: t('keyboard.categories.browsing'),
      shortcuts: [
        { description: t('keyboard.shortcuts.selectUp'), key: 'ArrowUp' },
        { description: t('keyboard.shortcuts.selectDown'), key: 'ArrowDown' },
        { description: t('keyboard.shortcuts.selectLeft'), key: 'ArrowLeft' },
        { description: t('keyboard.shortcuts.selectRight'), key: 'ArrowRight' },
        { description: t('keyboard.shortcuts.openSelected'), key: 'Enter' }
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
        description: t('keyboard.shortcuts.closeModal'),
        action: () => {
          if (showConfigModal) handleCloseConfigModal()
          else if (showKeyboardHelp) handleCloseKeyboardHelp()
        },
        category: SHORTCUT_CATEGORIES.GENERAL
      },
      {
        key: COMMON_SHORTCUTS.F1,
        description: t('keyboard.shortcuts.showHelp'),
        action: handleOpenKeyboardHelp,
        category: SHORTCUT_CATEGORIES.HELP
      },
      {
        key: COMMON_SHORTCUTS.F5,
        description: t('keyboard.shortcuts.refresh'),
        action: handleLoadImages,
        category: SHORTCUT_CATEGORIES.GENERAL
      },
      
      {
        key: COMMON_SHORTCUTS.COMMA,
        ctrlKey: true,
        description: t('keyboard.shortcuts.openConfig'),
        action: handleOpenConfigModal,
        category: SHORTCUT_CATEGORIES.GENERAL
      },
      
      // 搜索快捷键
      {
        key: COMMON_SHORTCUTS.SLASH,
        description: t('keyboard.shortcuts.focusSearch'),
        action: () => {
          // 使用更通用的选择器来查找搜索输入框
          const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
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
        description: t('keyboard.shortcuts.toggleView'),
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
      <AppThemeProvider>
        <div className="h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--app-theme-background-primary)' }}>
          <div className="text-center w-full max-w-md">
            <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <Settings className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('app.welcome')}</h1>
            <p className="text-gray-600 mb-8 text-lg">{t('app.subtitle')}</p>
            
            {isDemoMode && (
              <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Play className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-purple-800">{t('app.demoMode.title')}</h3>
                </div>
                <p className="text-purple-700 text-sm mb-3">
                  {t('app.demoMode.description')}
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
                    <span>{t('app.demoMode.downloadDemo')}</span>
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
            
            <p className="text-gray-500 mb-6 text-base">{t('app.description')}</p>
            <button
              onClick={handleOpenConfigModal}
              className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 text-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {t('app.configureGitHub')}
            </button>
          </div>

          {/* GitHub 配置模态框 */}
          <GitHubConfigModal
            isOpen={showConfigModal}
            onClose={handleCloseConfigModal}
            githubConfig={githubConfig}
            onSaveConfig={handleSaveConfig}
            onClearConfig={handleClearConfig}
            t={t}
          />
        </div>
      </AppThemeProvider>
    )
  }

  return (
    <AppThemeProvider>
      <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--app-theme-background-primary)' }}>
        {/* 顶部导航栏 */}
        <header className="shadow-sm border-b flex-shrink-0" style={{ backgroundColor: 'var(--app-theme-background-secondary)', borderColor: 'var(--app-theme-border-primary)' }}>
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-gray-900">{t('app.title')}</h1>
                <div className="text-sm text-gray-500 hidden sm:block">
                  {t('app.repository')}: {githubConfig.owner}/{githubConfig.repo}
                </div>
                {isDemoMode && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    <Play className="w-3 h-3" />
                    <span>{t('app.demoMode.title')}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                {/* <AppThemeToggle variant="compact" /> */}
                <LanguageSwitcher />
                <button
                  onClick={handleOpenConfigModal}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  title={`${t('navigation.settings')} (Ctrl+,)`}
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  onClick={handleLoadImages}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  title={`${t('navigation.refresh')} (F5)`}
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleOpenKeyboardHelp}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  title={`${t('navigation.help')} (F1)`}
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
            t={t}
          />

          {/* 图片上传区域 */}
          <div className="mb-4">
            <ImageUpload 
              t={t}
              onUploadImage={uploadImage}
              onUploadMultipleImages={uploadMultipleImages}
              loading={loading}
              batchUploadProgress={batchUploadProgress}
            />
          </div>

          {/* 图片统计和操作区域 */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('app.imageLibrary')} ({filteredImages.length} {t('app.images')})
            </h2>
            {loading && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t('app.loadingImages')}</span>
              </div>
            )}
          </div>

          {/* 图片浏览 */}
          <div className="min-h-0">
            <ImageBrowser 
              t={t}
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
        t={t}
      />

      {/* 键盘快捷键帮助模态框 */}
      <KeyboardHelpModal
        isOpen={showKeyboardHelp}
        onClose={handleCloseKeyboardHelp}
        categories={keyboardCategories}
        t={t}
      />

      <Toaster />
      </div>
    </AppThemeProvider>
  )
}

export default App