/**
 * 键盘快捷键管理系统
 * 提供统一的快捷键定义、注册和处理机制
 */

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
  category: string;
  enabled?: boolean;
}

export interface KeyboardShortcutCategory {
  name: string;
  description: string;
  shortcuts: KeyboardShortcut[];
}

export class KeyboardShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private categories: Map<string, KeyboardShortcutCategory> = new Map();
  private isEnabled = true;
  private eventListeners: Set<(event: KeyboardEvent) => void> = new Set();

  constructor() {
    this.bindGlobalKeydown();
  }

  /**
   * 注册快捷键
   */
  register(shortcut: KeyboardShortcut): void {
    const key = this.generateKey(shortcut);
    this.shortcuts.set(key, shortcut);

    // 添加到分类
    if (!this.categories.has(shortcut.category)) {
      this.categories.set(shortcut.category, {
        name: shortcut.category,
        description: '',
        shortcuts: [],
      });
    }

    const category = this.categories.get(shortcut.category)!;
    if (!category.shortcuts.find(s => this.generateKey(s) === key)) {
      category.shortcuts.push(shortcut);
    }
  }

  /**
   * 注销快捷键
   */
  unregister(shortcut: KeyboardShortcut): void {
    const key = this.generateKey(shortcut);
    this.shortcuts.delete(key);

    const category = this.categories.get(shortcut.category);
    if (category) {
      category.shortcuts = category.shortcuts.filter(
        s => this.generateKey(s) !== key
      );
    }
  }

  /**
   * 批量注册快捷键
   */
  registerBatch(shortcuts: KeyboardShortcut[]): void {
    shortcuts.forEach(shortcut => this.register(shortcut));
  }

  /**
   * 启用/禁用快捷键系统
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * 获取所有分类
   */
  getCategories(): KeyboardShortcutCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * 获取指定分类的快捷键
   */
  getShortcutsByCategory(category: string): KeyboardShortcut[] {
    return this.categories.get(category)?.shortcuts || [];
  }

  /**
   * 生成快捷键的唯一标识
   */
  private generateKey(shortcut: KeyboardShortcut): string {
    const modifiers = [];
    if (shortcut.ctrlKey) modifiers.push('ctrl');
    if (shortcut.altKey) modifiers.push('alt');
    if (shortcut.shiftKey) modifiers.push('shift');
    if (shortcut.metaKey) modifiers.push('meta');

    return `${modifiers.join('+')}+${shortcut.key.toLowerCase()}`;
  }

  /**
   * 绑定全局键盘事件
   */
  private bindGlobalKeydown(): void {
    const handleKeydown = (event: KeyboardEvent) => {
      if (!this.isEnabled) return;

      // 如果焦点在输入框、文本区域或可编辑元素上，跳过快捷键
      const target = event.target;
      if (
        target &&
        target instanceof HTMLElement &&
        this.isEditableElement(target)
      )
        return;

      const key = this.generateKey({
        key: event.key,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        metaKey: event.metaKey,
        description: '',
        action: () => {},
        category: '',
      });

      const shortcut = this.shortcuts.get(key);
      if (shortcut && shortcut.enabled !== false) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.action();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    this.eventListeners.add(handleKeydown);
  }

  /**
   * 检查是否为可编辑元素
   */
  private isEditableElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    const editableTags = ['input', 'textarea', 'select'];

    if (editableTags.includes(tagName)) return true;
    if (element.contentEditable === 'true') return true;
    if (element.getAttribute('role') === 'textbox') return true;

    return false;
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.eventListeners.forEach(listener => {
      document.removeEventListener('keydown', listener);
    });
    this.eventListeners.clear();
    this.shortcuts.clear();
    this.categories.clear();
  }
}

// 全局快捷键管理器实例
export const keyboardManager = new KeyboardShortcutManager();

// 常用快捷键定义
export const COMMON_SHORTCUTS = {
  // 通用快捷键
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',
  BACKSPACE: 'Backspace',
  DELETE: 'Delete',

  // 功能键
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

  // 方向键
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',

  // 字母和数字
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

  // 数字
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

  // 特殊字符
  SLASH: '/',
  COMMA: ',',
  PERIOD: '.',
} as const;

// 快捷键分类
export const SHORTCUT_CATEGORIES = {
  GENERAL: '通用',
  NAVIGATION: '导航',
  MODAL: '模态框',
  IMAGE_BROWSER: '图片浏览',
  IMAGE_EDIT: '图片编辑',
  SEARCH: '搜索',
  HELP: '帮助',
} as const;
