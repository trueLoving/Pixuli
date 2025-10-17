// 主题类型定义
export type ThemeMode = 'light' | 'dark' | 'auto'
export type ThemeVariant = 'default' | 'blue' | 'green' | 'purple' | 'orange' | 'red'

export interface ThemeColors {
  // 背景色
  background: {
    primary: string
    secondary: string
    tertiary: string
    quaternary?: string
  }
  // 文本色
  text: {
    primary: string
    secondary: string
    tertiary: string
    inverse: string
    disabled?: string
  }
  // 边框色
  border: {
    primary: string
    secondary: string
    focus: string
    disabled?: string
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
    primaryActive?: string
    secondary: string
    secondaryHover: string
    secondaryActive?: string
    disabled: string
  }
  // 阴影
  shadow: {
    sm: string
    md: string
    lg: string
    xl?: string
  }
  // 新增：表面色（用于卡片、模态框等）
  surface?: {
    primary: string
    secondary: string
    tertiary: string
  }
  // 新增：强调色
  accent?: {
    primary: string
    secondary: string
  }
}

export interface Theme {
  id: string
  name: string
  variant: ThemeVariant
  colors: ThemeColors
  description?: string
  isDark?: boolean
}

export interface ThemeContextType {
  currentTheme: Theme
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
  setTheme: (themeId: string) => void
  availableThemes: Theme[]
  isLoading?: boolean
}

// 主题配置接口
export interface ThemeConfig {
  defaultTheme: string
  defaultMode: ThemeMode
  enableSystemTheme: boolean
  enableTransitions: boolean
  customThemes?: Theme[]
}

// 预定义主题
export const themes: Record<string, Theme> = {
  light: {
    id: 'light',
    name: '浅色主题',
    variant: 'default',
    description: '经典的浅色主题，适合日间使用',
    isDark: false,
    colors: {
      background: {
        primary: '#ffffff',
        secondary: '#f8fafc',
        tertiary: '#f1f5f9',
        quaternary: '#e2e8f0'
      },
      text: {
        primary: '#111827',
        secondary: '#6b7280',
        tertiary: '#9ca3af',
        inverse: '#ffffff',
        disabled: '#d1d5db'
      },
      border: {
        primary: '#e5e7eb',
        secondary: '#d1d5db',
        focus: '#3b82f6',
        disabled: '#f3f4f6'
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
        primaryActive: '#1d4ed8',
        secondary: '#6b7280',
        secondaryHover: '#4b5563',
        secondaryActive: '#374151',
        disabled: '#d1d5db'
      },
      shadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      },
      surface: {
        primary: '#ffffff',
        secondary: '#f8fafc',
        tertiary: '#f1f5f9'
      },
      accent: {
        primary: '#3b82f6',
        secondary: '#8b5cf6'
      }
    }
  },
  dark: {
    id: 'dark',
    name: '深色主题',
    variant: 'default',
    description: '护眼的深色主题，适合夜间使用',
    isDark: true,
    colors: {
      background: {
        primary: '#111827',
        secondary: '#1f2937',
        tertiary: '#374151',
        quaternary: '#4b5563'
      },
      text: {
        primary: '#f9fafb',
        secondary: '#d1d5db',
        tertiary: '#9ca3af',
        inverse: '#111827',
        disabled: '#6b7280'
      },
      border: {
        primary: '#374151',
        secondary: '#4b5563',
        focus: '#60a5fa',
        disabled: '#1f2937'
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
        primaryActive: '#1d4ed8',
        secondary: '#6b7280',
        secondaryHover: '#9ca3af',
        secondaryActive: '#d1d5db',
        disabled: '#4b5563'
      },
      shadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
      },
      surface: {
        primary: '#1f2937',
        secondary: '#374151',
        tertiary: '#4b5563'
      },
      accent: {
        primary: '#60a5fa',
        secondary: '#a78bfa'
      }
    }
  },
  blue: {
    id: 'blue',
    name: '蓝色主题',
    variant: 'blue',
    description: '清新的蓝色主题，带来专业感',
    isDark: false,
    colors: {
      background: {
        primary: '#eff6ff',
        secondary: '#dbeafe',
        tertiary: '#bfdbfe',
        quaternary: '#93c5fd'
      },
      text: {
        primary: '#1e3a8a',
        secondary: '#3730a3',
        tertiary: '#4f46e5',
        inverse: '#ffffff',
        disabled: '#9ca3af'
      },
      border: {
        primary: '#93c5fd',
        secondary: '#60a5fa',
        focus: '#3b82f6',
        disabled: '#dbeafe'
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
        primaryActive: '#1d4ed8',
        secondary: '#6b7280',
        secondaryHover: '#4b5563',
        secondaryActive: '#374151',
        disabled: '#d1d5db'
      },
      shadow: {
        sm: '0 1px 2px 0 rgba(59, 130, 246, 0.1)',
        md: '0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1)',
        lg: '0 10px 15px -3px rgba(59, 130, 246, 0.2), 0 4px 6px -2px rgba(59, 130, 246, 0.1)',
        xl: '0 20px 25px -5px rgba(59, 130, 246, 0.3), 0 10px 10px -5px rgba(59, 130, 246, 0.1)'
      },
      surface: {
        primary: '#ffffff',
        secondary: '#f8fafc',
        tertiary: '#f1f5f9'
      },
      accent: {
        primary: '#3b82f6',
        secondary: '#1d4ed8'
      }
    }
  },
  green: {
    id: 'green',
    name: '绿色主题',
    variant: 'green',
    description: '自然的绿色主题，舒缓护眼',
    isDark: false,
    colors: {
      background: {
        primary: '#f0fdf4',
        secondary: '#dcfce7',
        tertiary: '#bbf7d0',
        quaternary: '#86efac'
      },
      text: {
        primary: '#14532d',
        secondary: '#166534',
        tertiary: '#15803d',
        inverse: '#ffffff',
        disabled: '#9ca3af'
      },
      border: {
        primary: '#86efac',
        secondary: '#4ade80',
        focus: '#22c55e',
        disabled: '#dcfce7'
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
        primaryActive: '#15803d',
        secondary: '#6b7280',
        secondaryHover: '#4b5563',
        secondaryActive: '#374151',
        disabled: '#d1d5db'
      },
      shadow: {
        sm: '0 1px 2px 0 rgba(34, 197, 94, 0.1)',
        md: '0 4px 6px -1px rgba(34, 197, 94, 0.2), 0 2px 4px -1px rgba(34, 197, 94, 0.1)',
        lg: '0 10px 15px -3px rgba(34, 197, 94, 0.2), 0 4px 6px -2px rgba(34, 197, 94, 0.1)',
        xl: '0 20px 25px -5px rgba(34, 197, 94, 0.3), 0 10px 10px -5px rgba(34, 197, 94, 0.1)'
      },
      surface: {
        primary: '#ffffff',
        secondary: '#f8fafc',
        tertiary: '#f1f5f9'
      },
      accent: {
        primary: '#22c55e',
        secondary: '#16a34a'
      }
    }
  }
}
