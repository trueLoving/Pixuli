import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  KeyboardShortcutManager,
  keyboardManager,
  COMMON_SHORTCUTS,
  SHORTCUT_CATEGORIES,
} from '../keyboardShortcuts';

describe('KeyboardShortcutManager', () => {
  let manager: KeyboardShortcutManager;
  let mockHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    manager = new KeyboardShortcutManager();
    mockHandler = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    manager.destroy();
    vi.restoreAllMocks();
  });

  describe('register', () => {
    it('应该注册快捷键', () => {
      const shortcut = {
        key: 'a',
        description: '测试快捷键',
        action: mockHandler,
        category: 'test',
      };

      manager.register(shortcut);

      // 触发快捷键 - 需要设置target
      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
      Object.defineProperty(event, 'target', {
        value: document.body,
        writable: false,
      });
      document.dispatchEvent(event);

      expect(mockHandler).toHaveBeenCalled();
    });

    it('应该创建分类如果不存在', () => {
      const shortcut = {
        key: 'a',
        description: '测试快捷键',
        action: mockHandler,
        category: 'new-category',
      };

      manager.register(shortcut);

      const categories = manager.getCategories();
      expect(categories.some(c => c.name === 'new-category')).toBe(true);
    });

    it('应该防止重复注册相同的快捷键', () => {
      const shortcut = {
        key: 'a',
        description: '测试快捷键',
        action: mockHandler,
        category: 'test',
      };

      manager.register(shortcut);
      manager.register(shortcut);

      const event = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(event);

      // 应该只调用一次
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('unregister', () => {
    it('应该注销快捷键', () => {
      const shortcut = {
        key: 'a',
        description: '测试快捷键',
        action: mockHandler,
        category: 'test',
      };

      manager.register(shortcut);
      manager.unregister(shortcut);

      const event = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(event);

      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('应该从分类中移除快捷键', () => {
      const shortcut = {
        key: 'a',
        description: '测试快捷键',
        action: mockHandler,
        category: 'test',
      };

      manager.register(shortcut);
      expect(manager.getShortcutsByCategory('test')).toHaveLength(1);

      manager.unregister(shortcut);
      expect(manager.getShortcutsByCategory('test')).toHaveLength(0);
    });
  });

  describe('registerBatch', () => {
    it('应该批量注册快捷键', () => {
      const shortcuts = [
        {
          key: 'a',
          description: '快捷键A',
          action: vi.fn(),
          category: 'test',
        },
        {
          key: 'b',
          description: '快捷键B',
          action: vi.fn(),
          category: 'test',
        },
      ];

      manager.registerBatch(shortcuts);

      const categoryShortcuts = manager.getShortcutsByCategory('test');
      expect(categoryShortcuts).toHaveLength(2);
    });
  });

  describe('setEnabled', () => {
    it('应该禁用快捷键系统', () => {
      const shortcut = {
        key: 'a',
        description: '测试快捷键',
        action: mockHandler,
        category: 'test',
      };

      manager.register(shortcut);
      manager.setEnabled(false);

      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
      Object.defineProperty(event, 'target', {
        value: document.body,
        writable: false,
      });
      document.dispatchEvent(event);

      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('应该重新启用快捷键系统', () => {
      const shortcut = {
        key: 'a',
        description: '测试快捷键',
        action: mockHandler,
        category: 'test',
      };

      manager.register(shortcut);
      manager.setEnabled(false);
      manager.setEnabled(true);

      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
      Object.defineProperty(event, 'target', {
        value: document.body,
        writable: false,
      });
      document.dispatchEvent(event);

      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('getCategories', () => {
    it('应该返回所有分类', () => {
      manager.register({
        key: 'a',
        description: '测试A',
        action: vi.fn(),
        category: 'category1',
      });

      manager.register({
        key: 'b',
        description: '测试B',
        action: vi.fn(),
        category: 'category2',
      });

      const categories = manager.getCategories();
      expect(categories.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getShortcutsByCategory', () => {
    it('应该返回指定分类的快捷键', () => {
      manager.register({
        key: 'a',
        description: '测试A',
        action: vi.fn(),
        category: 'test',
      });

      manager.register({
        key: 'b',
        description: '测试B',
        action: vi.fn(),
        category: 'test',
      });

      const shortcuts = manager.getShortcutsByCategory('test');
      expect(shortcuts).toHaveLength(2);
    });

    it('应该返回空数组对于不存在的分类', () => {
      const shortcuts = manager.getShortcutsByCategory('non-existent');
      expect(shortcuts).toEqual([]);
    });
  });

  describe('修饰键', () => {
    it('应该支持Ctrl键', () => {
      const shortcut = {
        key: 'a',
        ctrlKey: true,
        description: 'Ctrl+A',
        action: mockHandler,
        category: 'test',
      };

      manager.register(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        bubbles: true,
      });
      Object.defineProperty(event, 'target', {
        value: document.body,
        writable: false,
      });
      document.dispatchEvent(event);

      expect(mockHandler).toHaveBeenCalled();
    });

    it('应该支持Alt键', () => {
      const shortcut = {
        key: 'a',
        altKey: true,
        description: 'Alt+A',
        action: mockHandler,
        category: 'test',
      };

      manager.register(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        altKey: true,
        bubbles: true,
      });
      Object.defineProperty(event, 'target', {
        value: document.body,
        writable: false,
      });
      document.dispatchEvent(event);

      expect(mockHandler).toHaveBeenCalled();
    });

    it('应该支持Shift键', () => {
      const shortcut = {
        key: 'a',
        shiftKey: true,
        description: 'Shift+A',
        action: mockHandler,
        category: 'test',
      };

      manager.register(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        shiftKey: true,
        bubbles: true,
      });
      Object.defineProperty(event, 'target', {
        value: document.body,
        writable: false,
      });
      document.dispatchEvent(event);

      expect(mockHandler).toHaveBeenCalled();
    });

    it('应该支持Meta键', () => {
      const shortcut = {
        key: 'a',
        metaKey: true,
        description: 'Meta+A',
        action: mockHandler,
        category: 'test',
      };

      manager.register(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        metaKey: true,
        bubbles: true,
      });
      Object.defineProperty(event, 'target', {
        value: document.body,
        writable: false,
      });
      document.dispatchEvent(event);

      expect(mockHandler).toHaveBeenCalled();
    });

    it('应该支持组合键', () => {
      const shortcut = {
        key: 's',
        ctrlKey: true,
        shiftKey: true,
        description: 'Ctrl+Shift+S',
        action: mockHandler,
        category: 'test',
      };

      manager.register(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      Object.defineProperty(event, 'target', {
        value: document.body,
        writable: false,
      });
      document.dispatchEvent(event);

      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('可编辑元素', () => {
    it('应该忽略input元素中的键盘事件', () => {
      const shortcut = {
        key: 'a',
        description: '测试',
        action: mockHandler,
        category: 'test',
      };

      manager.register(shortcut);

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        bubbles: true,
      });
      input.dispatchEvent(event);

      expect(mockHandler).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('应该忽略textarea元素中的键盘事件', () => {
      const shortcut = {
        key: 'a',
        description: '测试',
        action: mockHandler,
        category: 'test',
      };

      manager.register(shortcut);

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        bubbles: true,
      });
      textarea.dispatchEvent(event);

      expect(mockHandler).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it('应该忽略contentEditable元素中的键盘事件', () => {
      const shortcut = {
        key: 'a',
        description: '测试',
        action: mockHandler,
        category: 'test',
      };

      manager.register(shortcut);

      const div = document.createElement('div');
      div.contentEditable = 'true';
      document.body.appendChild(div);
      div.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        bubbles: true,
      });
      div.dispatchEvent(event);

      expect(mockHandler).not.toHaveBeenCalled();

      document.body.removeChild(div);
    });
  });

  describe('enabled属性', () => {
    it('应该支持禁用单个快捷键', () => {
      const shortcut = {
        key: 'a',
        description: '测试',
        action: mockHandler,
        category: 'test',
        enabled: false,
      };

      manager.register(shortcut);

      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
      Object.defineProperty(event, 'target', {
        value: document.body,
        writable: false,
      });
      document.dispatchEvent(event);

      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('应该清理所有事件监听器', () => {
      const shortcut = {
        key: 'a',
        description: '测试',
        action: mockHandler,
        category: 'test',
      };

      manager.register(shortcut);
      manager.destroy();

      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
      Object.defineProperty(event, 'target', {
        value: document.body,
        writable: false,
      });
      document.dispatchEvent(event);

      expect(mockHandler).not.toHaveBeenCalled();
    });
  });
});

describe('keyboardManager', () => {
  it('应该是KeyboardShortcutManager的实例', () => {
    expect(keyboardManager).toBeInstanceOf(KeyboardShortcutManager);
  });
});

describe('COMMON_SHORTCUTS', () => {
  it('应该包含常用快捷键常量', () => {
    expect(COMMON_SHORTCUTS.ESCAPE).toBe('Escape');
    expect(COMMON_SHORTCUTS.ENTER).toBe('Enter');
    expect(COMMON_SHORTCUTS.ARROW_UP).toBe('ArrowUp');
    expect(COMMON_SHORTCUTS.A).toBe('a');
    expect(COMMON_SHORTCUTS.DIGIT_0).toBe('0');
  });
});

describe('SHORTCUT_CATEGORIES', () => {
  it('应该包含快捷键分类常量', () => {
    expect(SHORTCUT_CATEGORIES.GENERAL).toBe('通用');
    expect(SHORTCUT_CATEGORIES.NAVIGATION).toBe('导航');
    expect(SHORTCUT_CATEGORIES.MODAL).toBe('模态框');
  });
});
