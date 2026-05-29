/**
 * 键盘事件处理 Hook
 * 提供便捷的键盘事件监听和处理功能
 */

import { useEffect, useRef } from 'react';

export interface UseKeyboardOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

/**
 * 监听键盘事件的 Hook
 */
export function useKeyboard(
  key: string,
  handler: (event: KeyboardEvent) => void,
  options: UseKeyboardOptions = {},
) {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = false,
  } = options;

  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === key) {
        if (preventDefault) {
          event.preventDefault();
        }
        if (stopPropagation) {
          event.stopPropagation();
        }
        handlerRef.current(event);
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [key, enabled, preventDefault, stopPropagation]);
}

/**
 * 监听 Escape 键的 Hook
 */
export function useEscapeKey(handler: () => void, enabled: boolean = true) {
  useKeyboard('Escape', handler, { enabled });
}
