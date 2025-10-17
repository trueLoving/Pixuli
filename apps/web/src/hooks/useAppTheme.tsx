import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

// 主题类型定义
export type ThemeMode = 'light' | 'dark' | 'auto'
export type ThemeVariant = 'default' | 'blue' | 'green' | 'purple'

export interface AppTheme {
  id: string
  name: string
  variant: ThemeVariant
  isDark: boolean
  colors: {
    background: {
      primary: string
      secondary: string
      tertiary: string
    }
    text: {
      primary: string
      secondary: string
      tertiary: string
      inverse: string
    }
    border: {
      primary: string
      secondary: string
      focus: string
    }
    interactive: {
      primary: string
      primaryHover: string
      secondary: string
      secondaryHover: string
      disabled: string
    }
    status: {
      success: string
      warning: string
      error: string
      info: string
    }
    shadow: {
      sm: string
      md: string
      lg: string
    }
  }
}

// 预定义主题
export const appThemes: Record<string, AppTheme> = {
  light: {
    id: 'light',
    name: '浅色主题',
    variant: 'default',
    isDark: false,
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
      interactive: {
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        secondary: '#6b7280',
        secondaryHover: '#4b5563',
        disabled: '#d1d5db'
      },
      status: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      },
      shadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }
    }
  },
  dark: {
    id: 'dark',
    name: '深色主题',
    variant: 'default',
    isDark: true,
    colors: {
      background: {
        primary: '#111827',
        secondary: '#1f2937',
        tertiary: '#374151'
      },
      text: {
        primary: '#f9fafb',
        secondary: '#d1d5db',
        tertiary: '#9ca3af',
        inverse: '#111827'
      },
      border: {
        primary: '#374151',
        secondary: '#4b5563',
        focus: '#60a5fa'
      },
      interactive: {
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        secondary: '#6b7280',
        secondaryHover: '#9ca3af',
        disabled: '#4b5563'
      },
      status: {
        success: '#34d399',
        warning: '#fbbf24',
        error: '#f87171',
        info: '#60a5fa'
      },
      shadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)'
      }
    }
  },
  blue: {
    id: 'blue',
    name: '蓝色主题',
    variant: 'blue',
    isDark: false,
    colors: {
      background: {
        primary: '#eff6ff',
        secondary: '#dbeafe',
        tertiary: '#bfdbfe'
      },
      text: {
        primary: '#1e3a8a',
        secondary: '#3730a3',
        tertiary: '#4f46e5',
        inverse: '#ffffff'
      },
      border: {
        primary: '#93c5fd',
        secondary: '#60a5fa',
        focus: '#3b82f6'
      },
      interactive: {
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        secondary: '#6b7280',
        secondaryHover: '#4b5563',
        disabled: '#d1d5db'
      },
      status: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      },
      shadow: {
        sm: '0 1px 2px 0 rgba(59, 130, 246, 0.1)',
        md: '0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1)',
        lg: '0 10px 15px -3px rgba(59, 130, 246, 0.2), 0 4px 6px -2px rgba(59, 130, 246, 0.1)'
      }
    }
  },
  green: {
    id: 'green',
    name: '绿色主题',
    variant: 'green',
    isDark: false,
    colors: {
      background: {
        primary: '#f0fdf4',
        secondary: '#dcfce7',
        tertiary: '#bbf7d0'
      },
      text: {
        primary: '#14532d',
        secondary: '#166534',
        tertiary: '#15803d',
        inverse: '#ffffff'
      },
      border: {
        primary: '#86efac',
        secondary: '#4ade80',
        focus: '#22c55e'
      },
      interactive: {
        primary: '#22c55e',
        primaryHover: '#16a34a',
        secondary: '#6b7280',
        secondaryHover: '#4b5563',
        disabled: '#d1d5db'
      },
      status: {
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      },
      shadow: {
        sm: '0 1px 2px 0 rgba(34, 197, 94, 0.1)',
        md: '0 4px 6px -1px rgba(34, 197, 94, 0.2), 0 2px 4px -1px rgba(34, 197, 94, 0.1)',
        lg: '0 10px 15px -3px rgba(34, 197, 94, 0.2), 0 4px 6px -2px rgba(34, 197, 94, 0.1)'
      }
    }
  }
}

// 主题上下文类型
export interface AppThemeContextType {
  currentTheme: AppTheme
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
  setTheme: (themeId: string) => void
  availableThemes: AppTheme[]
}

// 创建主题上下文
const AppThemeContext = createContext<AppThemeContextType | undefined>(undefined)

// 主题Provider组件
interface AppThemeProviderProps {
  children: ReactNode
}

export const AppThemeProvider: React.FC<AppThemeProviderProps> = ({ children }) => {
  const [currentThemeId, setCurrentThemeId] = useState<string>(() => {
    const stored = localStorage.getItem('pixuli-app-theme')
    return stored || 'light'
  })
  
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('pixuli-app-theme-mode')
    return (stored as ThemeMode) || 'light'
  })
  
  const currentTheme = appThemes[currentThemeId] || appThemes.light
  const availableThemes = Object.values(appThemes)
  
  // 应用主题到DOM
  const applyTheme = (theme: AppTheme) => {
    const root = document.documentElement
    
    // 设置CSS自定义属性
    Object.entries(theme.colors).forEach(([category, colors]) => {
      Object.entries(colors).forEach(([key, value]) => {
        root.style.setProperty(`--app-theme-${category}-${key}`, value)
      })
    })
    
    // 设置主题属性
    root.setAttribute('data-app-theme', theme.id)
    root.setAttribute('data-app-theme-variant', theme.variant)
    
    if (theme.isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }
  
  // 处理主题变化
  const setTheme = (themeId: string) => {
    if (appThemes[themeId]) {
      setCurrentThemeId(themeId)
      applyTheme(appThemes[themeId])
      localStorage.setItem('pixuli-app-theme', themeId)
    }
  }
  
  // 处理主题模式变化
  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode)
    localStorage.setItem('pixuli-app-theme-mode', mode)
    
    // 根据模式选择主题
    if (mode === 'auto') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      setTheme(systemTheme)
    } else {
      setTheme(mode)
    }
  }
  
  // 初始化主题
  useEffect(() => {
    applyTheme(currentTheme)
  }, [currentTheme])
  
  // 监听系统主题变化
  useEffect(() => {
    if (themeMode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light'
        setTheme(systemTheme)
      }
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [themeMode])
  
  const contextValue: AppThemeContextType = {
    currentTheme,
    themeMode,
    setThemeMode,
    setTheme,
    availableThemes
  }
  
  return (
    <AppThemeContext.Provider value={contextValue}>
      <div className="app-theme-provider" data-app-theme={currentTheme.id}>
        {children}
      </div>
    </AppThemeContext.Provider>
  )
}

// Hook to use theme context
export const useAppTheme = (): AppThemeContextType => {
  const context = useContext(AppThemeContext)
  if (context === undefined) {
    throw new Error('useAppTheme must be used within an AppThemeProvider')
  }
  return context
}
