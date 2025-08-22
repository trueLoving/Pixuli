import React, { useState } from 'react'
import { useImageStore } from '@/stores/imageStore'

const TestComponent: React.FC = () => {
  const { githubConfig, setGitHubConfig, loadImages, loading, error } = useImageStore()
  const [testConfig, setTestConfig] = useState({
    owner: 'testuser',
    repo: 'testrepo',
    branch: 'main',
    token: 'test-token',
    path: 'images'
  })

  const handleTestConfig = () => {
    console.log('Setting test config:', testConfig)
    setGitHubConfig(testConfig)
  }

  const handleTestLoadImages = () => {
    console.log('Testing loadImages')
    loadImages()
  }

  const handleClearConfig = () => {
    localStorage.removeItem('pixuli_github_config')
    window.location.reload()
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">测试组件</h2>
      
      <div className="space-y-2">
        <h3 className="font-semibold">当前状态:</h3>
        <p>GitHub 配置: {githubConfig ? '已设置' : '未设置'}</p>
        <p>加载状态: {loading ? '加载中' : '空闲'}</p>
        <p>错误信息: {error || '无'}</p>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">测试操作:</h3>
        <div className="space-x-2">
          <button
            onClick={handleTestConfig}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            设置测试配置
          </button>
          <button
            onClick={handleTestLoadImages}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={loading}
          >
            测试加载图片
          </button>
          <button
            onClick={handleClearConfig}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            清除配置
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">响应式测试:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-100 p-4 rounded">
            <p className="text-sm">小屏幕 (默认)</p>
          </div>
          <div className="bg-green-100 p-4 rounded">
            <p className="text-sm">中等屏幕 (sm:)</p>
          </div>
          <div className="bg-purple-100 p-4 rounded">
            <p className="text-sm">大屏幕 (lg:)</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">窗口大小测试:</h3>
        <p>当前窗口宽度: <span className="font-mono">{window.innerWidth}px</span></p>
        <p>当前窗口高度: <span className="font-mono">{window.innerHeight}px</span></p>
      </div>
    </div>
  )
}

export default TestComponent 