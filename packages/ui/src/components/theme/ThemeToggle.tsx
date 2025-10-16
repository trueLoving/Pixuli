import React, { useState } from 'react'
import { Sun, Moon, Monitor, Palette } from 'lucide-react'
import { useThemeToggle } from './ThemeProvider'
import './ThemeToggle.css'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
  variant?: 'button' | 'dropdown' | 'compact'
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = true,
  variant = 'button'
}) => {
  const { themeMode, toggleTheme, setTheme, availableThemes } = useThemeToggle()
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
  
  const handleThemeSelect = (themeName: string) => {
    setTheme(themeName)
    setIsDropdownOpen(false)
  }
  
  if (variant === 'compact') {
    return (
      <button
        className={`theme-toggle-compact ${className}`}
        onClick={toggleTheme}
        title={`当前主题: ${getThemeLabel(themeMode)}`}
        aria-label={`切换到${getThemeLabel(themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'auto' : 'light')}主题`}
      >
        {getThemeIcon(themeMode)}
      </button>
    )
  }
  
  if (variant === 'dropdown') {
    return (
      <div className={`theme-toggle-dropdown ${className}`}>
        <button
          className="theme-toggle-dropdown-button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          {getThemeIcon(themeMode)}
          {showLabel && <span>{getThemeLabel(themeMode)}</span>}
        </button>
        
        {isDropdownOpen && (
          <div className="theme-toggle-dropdown-menu">
            <div className="theme-toggle-dropdown-header">
              <span>选择主题</span>
            </div>
            
            <div className="theme-toggle-dropdown-group">
              <div className="theme-toggle-dropdown-label">模式</div>
              <button
                className={`theme-toggle-dropdown-item ${themeMode === 'light' ? 'active' : ''}`}
                onClick={() => handleThemeSelect('light')}
              >
                <Sun size={14} />
                <span>浅色</span>
              </button>
              <button
                className={`theme-toggle-dropdown-item ${themeMode === 'dark' ? 'active' : ''}`}
                onClick={() => handleThemeSelect('dark')}
              >
                <Moon size={14} />
                <span>深色</span>
              </button>
              <button
                className={`theme-toggle-dropdown-item ${themeMode === 'auto' ? 'active' : ''}`}
                onClick={() => handleThemeSelect('auto')}
              >
                <Monitor size={14} />
                <span>自动</span>
              </button>
            </div>
            
            <div className="theme-toggle-dropdown-group">
              <div className="theme-toggle-dropdown-label">主题</div>
              {availableThemes.map((theme: any) => (
                <button
                  key={theme.name}
                  className="theme-toggle-dropdown-item"
                  onClick={() => handleThemeSelect(theme.name)}
                >
                  <div 
                    className="theme-toggle-color-preview"
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
            className="theme-toggle-dropdown-overlay"
            onClick={() => setIsDropdownOpen(false)}
          />
        )}
      </div>
    )
  }
  
  // 默认按钮样式
  return (
    <button
      className={`theme-toggle-button ${className}`}
      onClick={toggleTheme}
      title={`当前主题: ${getThemeLabel(themeMode)}`}
      aria-label={`切换到${getThemeLabel(themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'auto' : 'light')}主题`}
    >
      {getThemeIcon(themeMode)}
      {showLabel && <span>{getThemeLabel(themeMode)}</span>}
    </button>
  )
}

export default ThemeToggle
