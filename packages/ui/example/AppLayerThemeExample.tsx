import React, { useState, useEffect } from 'react'
import { ThemeProvider, ThemeToggle, ImageBrowser, applyThemeToDOM } from 'pixuli-ui'
import { themes, Theme, ThemeMode } from 'pixuli-ui'
import 'pixuli-ui/dist/index.css'

// 应用层主题管理示例
function App() {
  // 应用层管理主题状态
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes.light)
  const [themeMode, setThemeMode] = useState<ThemeMode>('light')
  const [availableThemes] = useState<Theme[]>(Object.values(themes))

  // 应用层处理主题切换
  const handleThemeChange = (themeName: string) => {
    const theme = availableThemes.find(t => t.name === themeName)
    if (theme) {
      setCurrentTheme(theme)
      // 应用层可以在这里添加持久化逻辑
      localStorage.setItem('selectedTheme', themeName)
    }
  }

  // 应用层处理模式切换
  const handleModeChange = (mode: ThemeMode) => {
    setThemeMode(mode)
    
    if (mode === 'auto') {
      // 应用层处理自动模式
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const systemTheme = mediaQuery.matches ? themes.dark : themes.light
      setCurrentTheme(systemTheme)
      
      // 监听系统主题变化
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        const newSystemTheme = e.matches ? themes.dark : themes.light
        setCurrentTheme(newSystemTheme)
      }
      
      mediaQuery.addEventListener('change', handleSystemThemeChange)
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
    } else {
      // 应用层处理固定模式
      const theme = mode === 'dark' ? themes.dark : themes.light
      setCurrentTheme(theme)
    }
    
    // 应用层可以在这里添加持久化逻辑
    localStorage.setItem('themeMode', mode)
  }

  // 应用层初始化主题
  useEffect(() => {
    // 从localStorage恢复主题设置
    const savedTheme = localStorage.getItem('selectedTheme')
    const savedMode = localStorage.getItem('themeMode') as ThemeMode
    
    if (savedTheme) {
      const theme = availableThemes.find(t => t.name === savedTheme)
      if (theme) {
        setCurrentTheme(theme)
      }
    }
    
    if (savedMode) {
      setThemeMode(savedMode)
    }
    
    // 应用主题到DOM
    applyThemeToDOM(currentTheme)
  }, [currentTheme])

  // 示例图片数据
  const sampleImages = [
    {
      id: '1',
      name: '示例图片1.jpg',
      url: 'https://via.placeholder.com/300x200',
      size: 1024000,
      type: 'image/jpeg',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      tags: ['示例', '测试'],
      dimensions: { width: 300, height: 200 }
    }
  ]

  return (
    <ThemeProvider
      currentTheme={currentTheme}
      themeMode={themeMode}
      onThemeChange={handleThemeChange}
      onModeChange={handleModeChange}
      availableThemes={availableThemes}
    >
      <div className="min-h-screen bg-theme-background-primary text-theme-text-primary">
        {/* 头部 */}
        <header className="border-b border-theme-border-primary bg-theme-background-secondary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-theme-text-primary">
                  应用层主题管理示例
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <ThemeToggle variant="dropdown" />
              </div>
            </div>
          </div>
        </header>

        {/* 主要内容 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-theme-text-primary mb-4">
              主题管理说明
            </h2>
            <div className="bg-theme-background-secondary p-4 rounded-lg border border-theme-border-primary">
              <p className="text-theme-text-secondary mb-2">
                <strong>当前主题:</strong> {currentTheme.name}
              </p>
              <p className="text-theme-text-secondary mb-2">
                <strong>主题模式:</strong> {themeMode}
              </p>
              <p className="text-theme-text-secondary">
                主题状态由应用层管理，组件库只负责响应主题变化。
                主题设置会自动保存到 localStorage。
              </p>
            </div>
          </div>

          {/* 图片浏览器示例 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-theme-text-primary mb-4">
              图片浏览器（响应主题）
            </h2>
            <div className="border border-theme-border-primary rounded-lg overflow-hidden">
              <ImageBrowser 
                images={sampleImages}
                className="h-96"
                formatFileSize={(size) => `${(size / 1024 / 1024).toFixed(2)} MB`}
              />
            </div>
          </div>

          {/* 主题色彩展示 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-theme-text-primary mb-4">
              当前主题色彩
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border border-theme-border-primary rounded-lg">
                <h3 className="font-medium text-theme-text-primary mb-2">背景色</h3>
                <div className="space-y-2">
                  <div className="h-8 bg-theme-background-primary border border-theme-border-primary rounded"></div>
                  <div className="h-8 bg-theme-background-secondary border border-theme-border-primary rounded"></div>
                  <div className="h-8 bg-theme-background-tertiary border border-theme-border-primary rounded"></div>
                </div>
              </div>
              
              <div className="p-4 border border-theme-border-primary rounded-lg">
                <h3 className="font-medium text-theme-text-primary mb-2">文本色</h3>
                <div className="space-y-2">
                  <div className="h-8 bg-theme-text-primary rounded flex items-center justify-center">
                    <span className="text-theme-text-inverse text-sm">主文本</span>
                  </div>
                  <div className="h-8 bg-theme-text-secondary rounded flex items-center justify-center">
                    <span className="text-theme-text-inverse text-sm">次文本</span>
                  </div>
                  <div className="h-8 bg-theme-text-tertiary rounded flex items-center justify-center">
                    <span className="text-theme-text-inverse text-sm">第三文本</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border border-theme-border-primary rounded-lg">
                <h3 className="font-medium text-theme-text-primary mb-2">状态色</h3>
                <div className="space-y-2">
                  <div className="h-8 bg-theme-status-success rounded flex items-center justify-center">
                    <span className="text-white text-sm">成功</span>
                  </div>
                  <div className="h-8 bg-theme-status-warning rounded flex items-center justify-center">
                    <span className="text-white text-sm">警告</span>
                  </div>
                  <div className="h-8 bg-theme-status-error rounded flex items-center justify-center">
                    <span className="text-white text-sm">错误</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border border-theme-border-primary rounded-lg">
                <h3 className="font-medium text-theme-text-primary mb-2">交互色</h3>
                <div className="space-y-2">
                  <div className="h-8 bg-theme-interactive-primary rounded flex items-center justify-center">
                    <span className="text-theme-text-inverse text-sm">主交互</span>
                  </div>
                  <div className="h-8 bg-theme-interactive-secondary rounded flex items-center justify-center">
                    <span className="text-theme-text-inverse text-sm">次交互</span>
                  </div>
                  <div className="h-8 bg-theme-interactive-disabled rounded flex items-center justify-center">
                    <span className="text-theme-text-inverse text-sm">禁用</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* 页脚 */}
        <footer className="border-t border-theme-border-primary bg-theme-background-secondary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-center text-theme-text-secondary">
              应用层主题管理示例 - 主题状态由应用层控制，组件库只负责响应
            </p>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  )
}

export default App
