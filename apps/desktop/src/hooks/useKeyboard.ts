/**
 * 键盘事件处理 Hook
 * 提供便捷的键盘事件监听和处理功能
 */

import { useEffect, useCallback, useRef } from 'react'
import { keyboardManager, KeyboardShortcut } from '@/utils/keyboardShortcuts'

export interface UseKeyboardOptions {
  enabled?: boolean
  preventDefault?: boolean
  stopPropagation?: boolean
}

/**
 * 监听键盘事件的 Hook
 */
export function useKeyboard(
  key: string,
  handler: (event: KeyboardEvent) => void,
  options: UseKeyboardOptions = {}
) {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = false
  } = options

  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!enabled) return

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === key) {
        if (preventDefault) {
          event.preventDefault()
        }
        if (stopPropagation) {
          event.stopPropagation()
        }
        handlerRef.current(event)
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [key, enabled, preventDefault, stopPropagation])
}

/**
 * 监听组合键的 Hook
 */
export function useKeyboardShortcut(
  shortcut: Omit<KeyboardShortcut, 'description' | 'category'>,
  options: UseKeyboardOptions = {}
) {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = false
  } = options

  const shortcutRef = useRef<KeyboardShortcut | null>(null)

  useEffect(() => {
    if (!enabled) return

    const fullShortcut: KeyboardShortcut = {
      ...shortcut,
      description: '',
      category: 'custom'
    }

    shortcutRef.current = fullShortcut
    keyboardManager.register(fullShortcut)

    return () => {
      if (shortcutRef.current) {
        keyboardManager.unregister(shortcutRef.current)
      }
    }
  }, [shortcut, enabled])

  // 更新快捷键处理函数
  useEffect(() => {
    if (shortcutRef.current) {
      shortcutRef.current.action = shortcut.action
    }
  }, [shortcut.action])
}

/**
 * 监听多个键盘事件的 Hook
 */
export function useKeyboardMultiple(
  keys: string[],
  handler: (event: KeyboardEvent) => void,
  options: UseKeyboardOptions = {}
) {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = false
  } = options

  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!enabled) return

    const handleKeydown = (event: KeyboardEvent) => {
      if (keys.includes(event.key)) {
        if (preventDefault) {
          event.preventDefault()
        }
        if (stopPropagation) {
          event.stopPropagation()
        }
        handlerRef.current(event)
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [keys, enabled, preventDefault, stopPropagation])
}

/**
 * 监听 Escape 键的 Hook
 */
export function useEscapeKey(
  handler: () => void,
  enabled: boolean = true
) {
  useKeyboard('Escape', handler, { enabled })
}

/**
 * 监听 Enter 键的 Hook
 */
export function useEnterKey(
  handler: () => void,
  enabled: boolean = true
) {
  useKeyboard('Enter', handler, { enabled })
}

/**
 * 监听方向键的 Hook
 */
export function useArrowKeys(
  handlers: {
    up?: () => void
    down?: () => void
    left?: () => void
    right?: () => void
  },
  enabled: boolean = true
) {
  useKeyboard('ArrowUp', handlers.up || (() => {}), { enabled })
  useKeyboard('ArrowDown', handlers.down || (() => {}), { enabled })
  useKeyboard('ArrowLeft', handlers.left || (() => {}), { enabled })
  useKeyboard('ArrowRight', handlers.right || (() => {}), { enabled })
}

/**
 * 监听数字键的 Hook
 */
export function useNumberKeys(
  handler: (number: number) => void,
  enabled: boolean = true
) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!enabled) return

    const handleKeydown = (event: KeyboardEvent) => {
      const number = parseInt(event.key)
      if (!isNaN(number) && number >= 0 && number <= 9) {
        event.preventDefault()
        handlerRef.current(number)
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [enabled])
}

/**
 * 监听字母键的 Hook
 */
export function useLetterKeys(
  handler: (letter: string) => void,
  enabled: boolean = true
) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!enabled) return

    const handleKeydown = (event: KeyboardEvent) => {
      const letter = event.key.toLowerCase()
      if (letter >= 'a' && letter <= 'z') {
        event.preventDefault()
        handlerRef.current(letter)
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [enabled])
}

/**
 * 检查是否在可编辑元素中
 */
export function isEditableElement(element: HTMLElement): boolean {
  const tagName = element.tagName.toLowerCase()
  const editableTags = ['input', 'textarea', 'select']
  
  if (editableTags.includes(tagName)) return true
  if (element.contentEditable === 'true') return true
  if (element.getAttribute('role') === 'textbox') return true
  
  return false
}

/**
 * 获取键盘事件的目标元素
 */
export function getKeyboardTarget(event: KeyboardEvent): HTMLElement {
  return event.target as HTMLElement
}

/**
 * 检查是否应该忽略键盘事件（在可编辑元素中）
 */
export function shouldIgnoreKeyboardEvent(event: KeyboardEvent): boolean {
  const target = getKeyboardTarget(event)
  return isEditableElement(target)
}
