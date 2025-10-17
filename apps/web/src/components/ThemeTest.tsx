import React from 'react'
import { AppThemeProvider, useAppTheme } from '../hooks/useAppTheme'
import AppThemeToggle from '../components/AppThemeToggle'
import './ThemeTest.css'

const ThemeTestContent: React.FC = () => {
  const { currentTheme, themeMode } = useAppTheme()
  
  return (
    <div className="theme-test-container">
      <header className="theme-test-header">
        <h1>Pixuli Web 主题系统测试</h1>
        <div className="theme-test-controls">
          <AppThemeToggle variant="dropdown" />
        </div>
      </header>

      <main className="theme-test-content">
        <section className="theme-test-section">
          <h2>当前主题信息</h2>
          <div className="theme-info">
            <p><strong>主题名称:</strong> {currentTheme.name}</p>
            <p><strong>主题ID:</strong> {currentTheme.id}</p>
            <p><strong>主题变体:</strong> {currentTheme.variant}</p>
            <p><strong>主题模式:</strong> {themeMode}</p>
            <p><strong>是否深色:</strong> {currentTheme.isDark ? '是' : '否'}</p>
          </div>
        </section>

        <section className="theme-test-section">
          <h2>颜色预览</h2>
          <div className="color-preview-grid">
            <div className="color-item">
              <div className="color-swatch" style={{ backgroundColor: currentTheme.colors.background.primary }}></div>
              <span>主背景</span>
            </div>
            <div className="color-item">
              <div className="color-swatch" style={{ backgroundColor: currentTheme.colors.background.secondary }}></div>
              <span>次背景</span>
            </div>
            <div className="color-item">
              <div className="color-swatch" style={{ backgroundColor: currentTheme.colors.text.primary }}></div>
              <span>主文本</span>
            </div>
            <div className="color-item">
              <div className="color-swatch" style={{ backgroundColor: currentTheme.colors.interactive.primary }}></div>
              <span>主交互</span>
            </div>
            <div className="color-item">
              <div className="color-swatch" style={{ backgroundColor: currentTheme.colors.border.primary }}></div>
              <span>主边框</span>
            </div>
            <div className="color-item">
              <div className="color-swatch" style={{ backgroundColor: currentTheme.colors.status.success }}></div>
              <span>成功状态</span>
            </div>
          </div>
        </section>

        <section className="theme-test-section">
          <h2>组件测试</h2>
          <div className="component-test">
            <button className="test-button primary">主要按钮</button>
            <button className="test-button secondary">次要按钮</button>
            <div className="test-card">
              <h3>测试卡片</h3>
              <p>这是一个测试卡片，用来验证主题变量是否正确应用。</p>
            </div>
            <div className="test-input-group">
              <label>测试输入框</label>
              <input type="text" placeholder="输入一些内容..." />
            </div>
          </div>
        </section>

        <section className="theme-test-section">
          <h2>主题切换器</h2>
          <div className="toggle-test">
            <AppThemeToggle variant="button" />
            <AppThemeToggle variant="compact" />
            <AppThemeToggle variant="dropdown" />
          </div>
        </section>
      </main>

      <footer className="theme-test-footer">
        <p>所有组件都应该自动响应主题变化</p>
      </footer>
    </div>
  )
}

export const ThemeTest: React.FC = () => {
  return (
    <AppThemeProvider>
      <ThemeTestContent />
    </AppThemeProvider>
  )
}

export default ThemeTest
