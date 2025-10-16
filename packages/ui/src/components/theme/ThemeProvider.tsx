import React, { createContext, useContext, ReactNode } from 'react'
import { ThemeContextType, Theme, ThemeMode } from '../../types/theme'

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  currentTheme?: Theme
  themeMode?: ThemeMode
  onThemeChange?: (themeName: string) => void
  onModeChange?: (mode: ThemeMode) => void
  availableThemes?: Theme[]
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  currentTheme,
  themeMode = 'light',
  onThemeChange,
  onModeChange,
  availableThemes = []
}) => {
  const contextValue: ThemeContextType = {
    currentTheme: currentTheme || {
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
    },
    themeMode,
    setThemeMode: onModeChange || (() => {}),
    setTheme: onThemeChange || (() => {}),
    availableThemes
  }
  
  return (
    <ThemeContext.Provider value={contextValue}>
      <div 
        className="theme-provider"
        data-theme={contextValue.currentTheme.name}
        data-theme-mode={themeMode}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

// Hook to use theme context
export const useThemeContext = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider')
  }
  return context
}

// 便捷的主题切换Hook
export const useThemeToggle = () => {
  const { themeMode, setThemeMode, setTheme, availableThemes } = useThemeContext()
  
  const toggleTheme = () => {
    if (themeMode === 'light') {
      setThemeMode('dark')
    } else if (themeMode === 'dark') {
      setThemeMode('auto')
    } else {
      setThemeMode('light')
    }
  }
  
  const cycleThemes = () => {
    const themeNames = availableThemes.map(theme => theme.name)
    const currentIndex = themeNames.findIndex(name => 
      availableThemes.find((theme: any) => theme.name === name)?.name === themeMode
    )
    const nextIndex = (currentIndex + 1) % themeNames.length
    if (themeNames[nextIndex]) {
      setTheme(themeNames[nextIndex])
    }
  }
  
  return {
    themeMode,
    toggleTheme,
    cycleThemes,
    setThemeMode,
    setTheme,
    availableThemes
  }
}
