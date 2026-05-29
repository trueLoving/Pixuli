import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboard, useEscapeKey } from '../useKeyboard';

describe('useKeyboard', () => {
  beforeEach(() => {
    vi.spyOn(document, 'addEventListener');
    vi.spyOn(document, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该注册键盘事件监听器', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboard('a', handler));
    expect(document.addEventListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function),
    );
  });

  it('应该在组件卸载时移除事件监听器', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useKeyboard('a', handler));
    unmount();
    expect(document.removeEventListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function),
    );
  });

  it('应该调用处理函数当按下对应键时', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboard('a', handler));

    const event = new KeyboardEvent('keydown', { key: 'a' });
    document.dispatchEvent(event);

    expect(handler).toHaveBeenCalled();
  });

  it('应该不调用处理函数当按下其他键时', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboard('a', handler));

    const event = new KeyboardEvent('keydown', { key: 'b' });
    document.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('应该默认阻止默认行为', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboard('a', handler));

    const event = new KeyboardEvent('keydown', { key: 'a', cancelable: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    document.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('应该不阻止默认行为当preventDefault为false时', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboard('a', handler, { preventDefault: false }));

    const event = new KeyboardEvent('keydown', { key: 'a', cancelable: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    document.dispatchEvent(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it('应该不注册监听器当enabled为false时', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboard('a', handler, { enabled: false }));

    const event = new KeyboardEvent('keydown', { key: 'a' });
    document.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });
});

describe('useEscapeKey', () => {
  it('应该监听 Escape 键', () => {
    const handler = vi.fn();
    renderHook(() => useEscapeKey(handler));

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);

    expect(handler).toHaveBeenCalled();
  });

  it('应该不监听当enabled为false时', () => {
    const handler = vi.fn();
    renderHook(() => useEscapeKey(handler, false));

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });
});
