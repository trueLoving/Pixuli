import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useKeyboard,
  useKeyboardShortcut,
  useKeyboardMultiple,
  useEscapeKey,
  useEnterKey,
  useArrowKeys,
  useNumberKeys,
  useLetterKeys,
  isEditableElement,
  getKeyboardTarget,
  shouldIgnoreKeyboardEvent,
} from '../useKeyboard';
import { keyboardManager } from '../../utils/keyboardShortcuts';

// Mock keyboardManager
vi.mock('../../utils/keyboardShortcuts', () => ({
  keyboardManager: {
    register: vi.fn(),
    unregister: vi.fn(),
  },
}));

describe('useKeyboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该监听指定的按键', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboard('a', handler));

    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
    document.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('应该不监听其他按键', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboard('a', handler));

    const event = new KeyboardEvent('keydown', { key: 'b', bubbles: true });
    document.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('应该默认阻止默认行为', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboard('a', handler));

    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    document.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('应该不阻止默认行为当preventDefault为false', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboard('a', handler, { preventDefault: false }));

    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    document.dispatchEvent(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it('应该阻止事件冒泡当stopPropagation为true', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboard('a', handler, { stopPropagation: true }));

    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
    const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');
    document.dispatchEvent(event);

    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('应该不监听当enabled为false', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboard('a', handler, { enabled: false }));

    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
    document.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('应该更新handler当handler变化', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const { rerender } = renderHook(
      ({ handler }) => useKeyboard('a', handler),
      {
        initialProps: { handler: handler1 },
      }
    );

    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
    document.dispatchEvent(event);

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).not.toHaveBeenCalled();

    rerender({ handler: handler2 });

    document.dispatchEvent(event);

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('应该清理事件监听器', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useKeyboard('a', handler));

    unmount();

    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
    document.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });
});

describe('useKeyboardShortcut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该注册快捷键', () => {
    const action = vi.fn();
    renderHook(() =>
      useKeyboardShortcut(
        {
          key: 'a',
          ctrlKey: true,
          action,
        },
        { enabled: true }
      )
    );

    expect(keyboardManager.register).toHaveBeenCalled();
  });

  it('应该不注册当enabled为false', () => {
    const action = vi.fn();
    renderHook(() =>
      useKeyboardShortcut(
        {
          key: 'a',
          ctrlKey: true,
          action,
        },
        { enabled: false }
      )
    );

    expect(keyboardManager.register).not.toHaveBeenCalled();
  });

  it('应该注销快捷键', () => {
    const action = vi.fn();
    const { unmount } = renderHook(() =>
      useKeyboardShortcut({
        key: 'a',
        ctrlKey: true,
        action,
      })
    );

    unmount();

    expect(keyboardManager.unregister).toHaveBeenCalled();
  });

  it('应该更新action', () => {
    const action1 = vi.fn();
    const action2 = vi.fn();

    const { rerender } = renderHook(
      ({ action }) =>
        useKeyboardShortcut({
          key: 'a',
          ctrlKey: true,
          action,
        }),
      {
        initialProps: { action: action1 },
      }
    );

    expect(keyboardManager.register).toHaveBeenCalled();

    rerender({ action: action2 });

    // action应该通过useEffect更新
    // 由于useKeyboardShortcut内部使用useEffect更新action，我们验证register被调用了两次
    expect(keyboardManager.register).toHaveBeenCalledTimes(2);
  });
});

describe('useKeyboardMultiple', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该监听多个按键', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardMultiple(['a', 'b', 'c'], handler));

    const eventA = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
    const eventB = new KeyboardEvent('keydown', { key: 'b', bubbles: true });
    const eventC = new KeyboardEvent('keydown', { key: 'c', bubbles: true });
    const eventD = new KeyboardEvent('keydown', { key: 'd', bubbles: true });

    document.dispatchEvent(eventA);
    document.dispatchEvent(eventB);
    document.dispatchEvent(eventC);
    document.dispatchEvent(eventD);

    expect(handler).toHaveBeenCalledTimes(3);
    expect(handler).toHaveBeenCalledWith(eventA);
    expect(handler).toHaveBeenCalledWith(eventB);
    expect(handler).toHaveBeenCalledWith(eventC);
  });

  it('应该不监听不在列表中的按键', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardMultiple(['a', 'b'], handler));

    const event = new KeyboardEvent('keydown', { key: 'c', bubbles: true });
    document.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });
});

describe('useEscapeKey', () => {
  it('应该监听Escape键', () => {
    const handler = vi.fn();
    renderHook(() => useEscapeKey(handler));

    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });
    document.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('应该不监听当enabled为false', () => {
    const handler = vi.fn();
    renderHook(() => useEscapeKey(handler, false));

    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });
    document.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });
});

describe('useEnterKey', () => {
  it('应该监听Enter键', () => {
    const handler = vi.fn();
    renderHook(() => useEnterKey(handler));

    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    document.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('useArrowKeys', () => {
  it('应该监听所有方向键', () => {
    const handlers = {
      up: vi.fn(),
      down: vi.fn(),
      left: vi.fn(),
      right: vi.fn(),
    };

    renderHook(() => useArrowKeys(handlers));

    const upEvent = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      bubbles: true,
    });
    const downEvent = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
    });
    const leftEvent = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      bubbles: true,
    });
    const rightEvent = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
    });

    document.dispatchEvent(upEvent);
    document.dispatchEvent(downEvent);
    document.dispatchEvent(leftEvent);
    document.dispatchEvent(rightEvent);

    expect(handlers.up).toHaveBeenCalledTimes(1);
    expect(handlers.down).toHaveBeenCalledTimes(1);
    expect(handlers.left).toHaveBeenCalledTimes(1);
    expect(handlers.right).toHaveBeenCalledTimes(1);
  });

  it('应该只监听提供的处理器', () => {
    const handlers = {
      up: vi.fn(),
    };

    renderHook(() => useArrowKeys(handlers));

    const upEvent = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      bubbles: true,
    });
    const downEvent = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
    });

    document.dispatchEvent(upEvent);
    document.dispatchEvent(downEvent);

    expect(handlers.up).toHaveBeenCalledTimes(1);
  });
});

describe('useNumberKeys', () => {
  it('应该监听数字键0-9', () => {
    const handler = vi.fn();
    renderHook(() => useNumberKeys(handler));

    for (let i = 0; i <= 9; i++) {
      const event = new KeyboardEvent('keydown', {
        key: String(i),
        bubbles: true,
      });
      document.dispatchEvent(event);
    }

    expect(handler).toHaveBeenCalledTimes(10);
    expect(handler).toHaveBeenNthCalledWith(1, 0);
    expect(handler).toHaveBeenNthCalledWith(10, 9);
  });

  it('应该不监听非数字键', () => {
    const handler = vi.fn();
    renderHook(() => useNumberKeys(handler));

    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
    document.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('应该不监听当enabled为false', () => {
    const handler = vi.fn();
    renderHook(() => useNumberKeys(handler, false));

    const event = new KeyboardEvent('keydown', { key: '1', bubbles: true });
    document.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });
});

describe('useLetterKeys', () => {
  it('应该监听字母键a-z', () => {
    const handler = vi.fn();
    renderHook(() => useLetterKeys(handler));

    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
    document.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('a');
  });

  it('应该将字母转换为小写', () => {
    const handler = vi.fn();
    renderHook(() => useLetterKeys(handler));

    const event = new KeyboardEvent('keydown', { key: 'A', bubbles: true });
    document.dispatchEvent(event);

    expect(handler).toHaveBeenCalledWith('a');
  });

  it('应该不监听非字母键', () => {
    const handler = vi.fn();
    renderHook(() => useLetterKeys(handler));

    const event = new KeyboardEvent('keydown', { key: '1', bubbles: true });
    document.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });
});

describe('isEditableElement', () => {
  it('应该识别input元素', () => {
    const input = document.createElement('input');
    expect(isEditableElement(input)).toBe(true);
  });

  it('应该识别textarea元素', () => {
    const textarea = document.createElement('textarea');
    expect(isEditableElement(textarea)).toBe(true);
  });

  it('应该识别select元素', () => {
    const select = document.createElement('select');
    expect(isEditableElement(select)).toBe(true);
  });

  it('应该识别contentEditable元素', () => {
    const div = document.createElement('div');
    div.contentEditable = 'true';
    expect(isEditableElement(div)).toBe(true);
  });

  it('应该识别role为textbox的元素', () => {
    const div = document.createElement('div');
    div.setAttribute('role', 'textbox');
    expect(isEditableElement(div)).toBe(true);
  });

  it('应该不识别普通div元素', () => {
    const div = document.createElement('div');
    expect(isEditableElement(div)).toBe(false);
  });
});

describe('getKeyboardTarget', () => {
  it('应该返回事件的目标元素', () => {
    const div = document.createElement('div');
    const event = new KeyboardEvent('keydown', { bubbles: true });
    Object.defineProperty(event, 'target', {
      value: div,
      writable: false,
    });

    expect(getKeyboardTarget(event)).toBe(div);
  });
});

describe('shouldIgnoreKeyboardEvent', () => {
  it('应该在可编辑元素中返回true', () => {
    const input = document.createElement('input');
    const event = new KeyboardEvent('keydown', { bubbles: true });
    Object.defineProperty(event, 'target', {
      value: input,
      writable: false,
    });

    expect(shouldIgnoreKeyboardEvent(event)).toBe(true);
  });

  it('应该在非可编辑元素中返回false', () => {
    const div = document.createElement('div');
    const event = new KeyboardEvent('keydown', { bubbles: true });
    Object.defineProperty(event, 'target', {
      value: div,
      writable: false,
    });

    expect(shouldIgnoreKeyboardEvent(event)).toBe(false);
  });
});
