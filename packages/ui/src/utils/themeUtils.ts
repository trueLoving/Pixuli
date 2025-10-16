import { Theme } from '../types/theme'

// 应用主题到DOM的工具函数
export const applyThemeToDOM = (theme: Theme) => {
  if (typeof document === 'undefined') return
  
  const root = document.documentElement
  
  // 设置CSS自定义属性
  Object.entries(theme.colors).forEach(([category, colors]) => {
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${category}-${key}`, value as string)
    })
  })
  
  // 设置主题类名
  root.setAttribute('data-theme', theme.name)
  
  // 根据主题类型设置data属性
  if (theme.name === '深色主题') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

// 初始化默认主题
export const initializeDefaultTheme = () => {
  const defaultTheme: Theme = {
    name: '浅色主题',
    colors: {
      background: {
        primary: '#ffffff',
        secondary: '#f8fafc',
        tertiary: '#f1f5f9'
      },
      text: {
        primary: '#111827',
        secondary: '#6b7280',
        tertiary: '#9ca3af',
        inverse: '#ffffff'
      },
      border: {
        primary: '#e5e7eb',
        secondary: '#d1d5db',
        focus: '#3b82f6'
      },
      status: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      },
      interactive: {
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        secondary: '#6b7280',
        secondaryHover: '#4b5563',
        disabled: '#d1d5db'
      },
      shadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }
    }
  }
  
  applyThemeToDOM(defaultTheme)
}
