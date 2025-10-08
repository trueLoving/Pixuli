/**
 * 键盘快捷键管理系统
 * 提供统一的快捷键定义、注册和处理机制
 */

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
  description: string
  action: () => void
  category: string
  enabled?: boolean
}

export interface KeyboardShortcutCategory {
  name: string
  description: string
  shortcuts: KeyboardShortcut[]
}

export class KeyboardShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private categories: Map<string, KeyboardShortcutCategory> = new Map()
  private isEnabled = true
  private eventListeners: Set<(event: KeyboardEvent) => void> = new Set()

  constructor() {
    this.bindGlobalKeydown()
  }

  /**
   * 注册快捷键
   */
  register(shortcut: KeyboardShortcut): void {
    const key = this.generateKey(shortcut)
    this.shortcuts.set(key, shortcut)
    
    // 添加到分类
    if (!this.categories.has(shortcut.category)) {
      this.categories.set(shortcut.category, {
        name: shortcut.category,
        description: '',
        shortcuts: []
      })
    }
    
    const category = this.categories.get(shortcut.category)!
    category.shortcuts.push(shortcut)
  }

  /**
   * 批量注册快捷键
   */
  registerBatch(shortcuts: KeyboardShortcut[]): void {
    shortcuts.forEach(shortcut => this.register(shortcut))
  }

  /**
   * 注销快捷键
   */
  unregister(shortcut: KeyboardShortcut): void {
    const key = this.generateKey(shortcut)
    this.shortcuts.delete(key)
    
    // 从分类中移除
    const category = this.categories.get(shortcut.category)
    if (category) {
      category.shortcuts = category.shortcuts.filter(s => s !== shortcut)
    }
  }

  /**
   * 启用/禁用快捷键
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }

  /**
   * 获取所有快捷键分类
   */
  getCategories(): KeyboardShortcutCategory[] {
    return Array.from(this.categories.values())
  }

  /**
   * 获取指定分类的快捷键
   */
  getShortcutsByCategory(category: string): KeyboardShortcut[] {
    const cat = this.categories.get(category)
    return cat ? cat.shortcuts : []
  }

  /**
   * 生成快捷键的唯一键
   */
  private generateKey(shortcut: KeyboardShortcut): string {
    const modifiers = []
    if (shortcut.ctrlKey) modifiers.push('ctrl')
    if (shortcut.altKey) modifiers.push('alt')
    if (shortcut.shiftKey) modifiers.push('shift')
    if (shortcut.metaKey) modifiers.push('meta')
    
    return `${modifiers.join('+')}+${shortcut.key.toLowerCase()}`
  }

  /**
   * 绑定全局键盘事件
   */
  private bindGlobalKeydown(): void {
    const handleKeydown = (event: KeyboardEvent) => {
      if (!this.isEnabled) return
      
      // 检查是否在输入框中
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return
      }

      const key = this.generateKey({
        key: event.key,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        metaKey: event.metaKey,
        description: '',
        action: () => {},
        category: ''
      })

      const shortcut = this.shortcuts.get(key)
      if (shortcut && shortcut.enabled !== false) {
        event.preventDefault()
        shortcut.action()
      }
    }

    document.addEventListener('keydown', handleKeydown)
    this.eventListeners.add(handleKeydown)
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.eventListeners.forEach(listener => {
      document.removeEventListener('keydown', listener)
    })
    this.eventListeners.clear()
    this.shortcuts.clear()
    this.categories.clear()
  }
}

// 创建全局实例
export const keyboardManager = new KeyboardShortcutManager()

// 常用快捷键常量
export const COMMON_SHORTCUTS = {
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  SPACE: ' ',
  DELETE: 'Delete',
  BACKSPACE: 'Backspace',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
  F1: 'F1',
  F2: 'F2',
  F3: 'F3',
  F4: 'F4',
  F5: 'F5',
  F6: 'F6',
  F7: 'F7',
  F8: 'F8',
  F9: 'F9',
  F10: 'F10',
  F11: 'F11',
  F12: 'F12',
  A: 'a',
  B: 'b',
  C: 'c',
  D: 'd',
  E: 'e',
  F: 'f',
  G: 'g',
  H: 'h',
  I: 'i',
  J: 'j',
  K: 'k',
  L: 'l',
  M: 'm',
  N: 'n',
  O: 'o',
  P: 'p',
  Q: 'q',
  R: 'r',
  S: 's',
  T: 't',
  U: 'u',
  V: 'v',
  W: 'w',
  X: 'x',
  Y: 'y',
  Z: 'z',
  COMMA: ',',
  PERIOD: '.',
  SLASH: '/',
  BACKSLASH: '\\',
  SEMICOLON: ';',
  QUOTE: "'",
  BRACKET_LEFT: '[',
  BRACKET_RIGHT: ']',
  MINUS: '-',
  EQUAL: '=',
  BACKTICK: '`',
  DIGIT_0: '0',
  DIGIT_1: '1',
  DIGIT_2: '2',
  DIGIT_3: '3',
  DIGIT_4: '4',
  DIGIT_5: '5',
  DIGIT_6: '6',
  DIGIT_7: '7',
  DIGIT_8: '8',
  DIGIT_9: '9',
} as const

// 快捷键分类
export const SHORTCUT_CATEGORIES = {
  GENERAL: '通用',
  NAVIGATION: '导航',
  EDITING: '编辑',
  VIEW: '视图',
  SEARCH: '搜索',
  IMAGE_BROWSER: '图片浏览',
  HELP: '帮助',
} as const
