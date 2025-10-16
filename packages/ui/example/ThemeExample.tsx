import React from 'react'
import { ThemeProvider, ThemeToggle, ImageBrowser } from 'pixuli-ui'
import 'pixuli-ui/dist/index.css'

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
  },
  {
    id: '2',
    name: '示例图片2.png',
    url: 'https://via.placeholder.com/400x300',
    size: 2048000,
    type: 'image/png',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    tags: ['示例', 'PNG'],
    dimensions: { width: 400, height: 300 }
  }
]

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-theme-background-primary text-theme-text-primary">
        {/* 头部 */}
        <header className="border-b border-theme-border-primary bg-theme-background-secondary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-theme-text-primary">
                  Pixuli UI 主题示例
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
              主题功能演示
            </h2>
            <p className="text-theme-text-secondary mb-6">
              这个示例展示了 Pixuli UI 的主题系统功能。你可以使用右上角的主题切换器来切换不同的主题。
            </p>
            
            {/* 主题切换器展示 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 border border-theme-border-primary rounded-lg bg-theme-background-secondary">
                <h3 className="font-medium text-theme-text-primary mb-2">基础按钮</h3>
                <ThemeToggle variant="button" />
              </div>
              
              <div className="p-4 border border-theme-border-primary rounded-lg bg-theme-background-secondary">
                <h3 className="font-medium text-theme-text-primary mb-2">紧凑样式</h3>
                <ThemeToggle variant="compact" />
              </div>
              
              <div className="p-4 border border-theme-border-primary rounded-lg bg-theme-background-secondary">
                <h3 className="font-medium text-theme-text-primary mb-2">下拉菜单</h3>
                <ThemeToggle variant="dropdown" />
              </div>
            </div>
          </div>

          {/* 图片浏览器示例 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-theme-text-primary mb-4">
              图片浏览器（支持主题）
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
              主题色彩系统
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
              Pixuli UI 主题系统示例 - 支持浅色、深色、蓝色、绿色主题
            </p>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  )
}

export default App
