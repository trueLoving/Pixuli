// 主题类型定义
export type ThemeMode = 'light' | 'dark' | 'auto'

export interface ThemeColors {
  // 背景色
  background: {
    primary: string
    secondary: string
    tertiary: string
  }
  // 文本色
  text: {
    primary: string
    secondary: string
    tertiary: string
    inverse: string
  }
  // 边框色
  border: {
    primary: string
    secondary: string
    focus: string
  }
  // 状态色
  status: {
    success: string
    warning: string
    error: string
    info: string
  }
  // 交互色
  interactive: {
    primary: string
    primaryHover: string
    secondary: string
    secondaryHover: string
    disabled: string
  }
  // 阴影
  shadow: {
    sm: string
    md: string
    lg: string
  }
}

export interface Theme {
  name: string
  colors: ThemeColors
}

export interface ThemeContextType {
  currentTheme: Theme
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
  setTheme: (themeName: string) => void
  availableThemes: Theme[]
}

// 预定义主题
export const themes: Record<string, Theme> = {
  light: {
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
  dark: {
    name: '深色主题',
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
      status: {
        success: '#34d399',
        warning: '#fbbf24',
        error: '#f87171',
        info: '#60a5fa'
      },
      interactive: {
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        secondary: '#6b7280',
        secondaryHover: '#9ca3af',
        disabled: '#4b5563'
      },
      shadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)'
      }
    }
  },
  blue: {
    name: '蓝色主题',
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
        sm: '0 1px 2px 0 rgba(59, 130, 246, 0.1)',
        md: '0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1)',
        lg: '0 10px 15px -3px rgba(59, 130, 246, 0.2), 0 4px 6px -2px rgba(59, 130, 246, 0.1)'
      }
    }
  },
  green: {
    name: '绿色主题',
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
      status: {
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      },
      interactive: {
        primary: '#22c55e',
        primaryHover: '#16a34a',
        secondary: '#6b7280',
        secondaryHover: '#4b5563',
        disabled: '#d1d5db'
      },
      shadow: {
        sm: '0 1px 2px 0 rgba(34, 197, 94, 0.1)',
        md: '0 4px 6px -1px rgba(34, 197, 94, 0.2), 0 2px 4px -1px rgba(34, 197, 94, 0.1)',
        lg: '0 10px 15px -3px rgba(34, 197, 94, 0.2), 0 4px 6px -2px rgba(34, 197, 94, 0.1)'
      }
    }
  }
}
