import React, { useState } from 'react'
import { Sun, Moon, Monitor, Palette } from 'lucide-react'
import { useAppTheme } from '../hooks/useAppTheme'

interface AppThemeToggleProps {
  variant?: 'button' | 'compact' | 'dropdown'
  className?: string
}

export const AppThemeToggle: React.FC<AppThemeToggleProps> = ({
  variant = 'compact',
  className = ''
}) => {
  const { themeMode, currentTheme, setThemeMode, setTheme, availableThemes } = useAppTheme()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  const getThemeIcon = (mode: string) => {
    switch (mode) {
      case 'light':
        return <Sun size={16} />
      case 'dark':
        return <Moon size={16} />
      case 'auto':
        return <Monitor size={16} />
      default:
        return <Palette size={16} />
    }
  }
  
  const getThemeLabel = (mode: string) => {
    switch (mode) {
      case 'light':
        return '浅色'
      case 'dark':
        return '深色'
      case 'auto':
        return '自动'
      default:
        return '主题'
    }
  }
  
  const toggleThemeMode = () => {
    if (themeMode === 'light') {
      setThemeMode('dark')
    } else if (themeMode === 'dark') {
      setThemeMode('auto')
    } else {
      setThemeMode('light')
    }
  }
  
  const handleThemeSelect = (themeId: string) => {
    setTheme(themeId)
    setIsDropdownOpen(false)
  }
  
  if (variant === 'compact') {
    return (
      <button
        className={`app-theme-toggle-compact ${className}`}
        onClick={toggleThemeMode}
        title={`当前主题: ${currentTheme.name} (${getThemeLabel(themeMode)})`}
        aria-label={`切换到${getThemeLabel(themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'auto' : 'light')}主题`}
      >
        {getThemeIcon(themeMode)}
      </button>
    )
  }
  
  if (variant === 'dropdown') {
    return (
      <div className={`app-theme-toggle-dropdown ${className}`}>
        <button
          className="app-theme-toggle-dropdown-button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          {getThemeIcon(themeMode)}
          <span>{getThemeLabel(themeMode)}</span>
        </button>
        
        {isDropdownOpen && (
          <div className="app-theme-toggle-dropdown-menu">
            <div className="app-theme-toggle-dropdown-header">
              <span>选择主题</span>
            </div>
            
            <div className="app-theme-toggle-dropdown-group">
              <div className="app-theme-toggle-dropdown-label">模式</div>
              <button
                className={`app-theme-toggle-dropdown-item ${themeMode === 'light' ? 'active' : ''}`}
                onClick={() => setThemeMode('light')}
              >
                <Sun size={14} />
                <span>浅色</span>
              </button>
              <button
                className={`app-theme-toggle-dropdown-item ${themeMode === 'dark' ? 'active' : ''}`}
                onClick={() => setThemeMode('dark')}
              >
                <Moon size={14} />
                <span>深色</span>
              </button>
              <button
                className={`app-theme-toggle-dropdown-item ${themeMode === 'auto' ? 'active' : ''}`}
                onClick={() => setThemeMode('auto')}
              >
                <Monitor size={14} />
                <span>自动</span>
              </button>
            </div>
            
            <div className="app-theme-toggle-dropdown-group">
              <div className="app-theme-toggle-dropdown-label">主题</div>
              {availableThemes.map((theme) => (
                <button
                  key={theme.id}
                  className={`app-theme-toggle-dropdown-item ${currentTheme.id === theme.id ? 'active' : ''}`}
                  onClick={() => handleThemeSelect(theme.id)}
                >
                  <div 
                    className="app-theme-toggle-color-preview"
                    style={{ backgroundColor: theme.colors.interactive.primary }}
                  />
                  <span>{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* 点击外部关闭下拉菜单 */}
        {isDropdownOpen && (
          <div 
            className="app-theme-toggle-dropdown-overlay"
            onClick={() => setIsDropdownOpen(false)}
          />
        )}
      </div>
    )
  }
  
  // 默认按钮样式
  return (
    <button
      className={`app-theme-toggle-button ${className}`}
      onClick={toggleThemeMode}
      title={`当前主题: ${currentTheme.name} (${getThemeLabel(themeMode)})`}
      aria-label={`切换到${getThemeLabel(themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'auto' : 'light')}主题`}
    >
      {getThemeIcon(themeMode)}
      <span>{getThemeLabel(themeMode)}</span>
    </button>
  )
}

export default AppThemeToggle
