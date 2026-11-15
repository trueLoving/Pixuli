import { COMMON_SHORTCUTS, SHORTCUT_CATEGORIES } from '@/ui';
import {
  requestClearLibrarySearch,
  requestOpenLibrarySearch,
} from '@/features/library/librarySearchEvents';

// 键盘快捷键配置
export const createKeyboardShortcuts = (t: (key: string) => string) => [
  // 通用快捷键
  {
    key: COMMON_SHORTCUTS.ESCAPE,
    description: t('keyboard.shortcuts.closeModal'),
    action: () => {
      const event = new CustomEvent('closeModals');
      window.dispatchEvent(event);
    },
    category: SHORTCUT_CATEGORIES.GENERAL,
  },
  {
    key: COMMON_SHORTCUTS.F5,
    description: t('keyboard.shortcuts.refresh'),
    action: () => {
      const event = new CustomEvent('refreshAssets');
      window.dispatchEvent(event);
    },
    category: SHORTCUT_CATEGORIES.GENERAL,
  },
  {
    key: COMMON_SHORTCUTS.COMMA,
    ctrlKey: true,
    description: t('keyboard.shortcuts.openConfig'),
    action: () => {
      const event = new CustomEvent('openConfig');
      window.dispatchEvent(event);
    },
    category: SHORTCUT_CATEGORIES.GENERAL,
  },
  // 搜索：Cmd+K（mac）与 Ctrl+K（其它）
  {
    key: COMMON_SHORTCUTS.K,
    metaKey: true,
    description: t('keyboard.shortcuts.focusSearch'),
    action: () => requestOpenLibrarySearch(),
    category: SHORTCUT_CATEGORIES.SEARCH,
  },
  {
    key: COMMON_SHORTCUTS.K,
    ctrlKey: true,
    description: t('keyboard.shortcuts.focusSearch'),
    action: () => requestOpenLibrarySearch(),
    category: SHORTCUT_CATEGORIES.SEARCH,
  },
  // 清除搜索：Cmd/Ctrl+Shift+K
  {
    key: COMMON_SHORTCUTS.K,
    metaKey: true,
    shiftKey: true,
    description: t('keyboard.shortcuts.clearSearch'),
    action: () => requestClearLibrarySearch(),
    category: SHORTCUT_CATEGORIES.SEARCH,
  },
  {
    key: COMMON_SHORTCUTS.K,
    ctrlKey: true,
    shiftKey: true,
    description: t('keyboard.shortcuts.clearSearch'),
    action: () => requestClearLibrarySearch(),
    category: SHORTCUT_CATEGORIES.SEARCH,
  },
  {
    key: COMMON_SHORTCUTS.L,
    ctrlKey: true,
    shiftKey: true,
    description: t('keyboard.shortcuts.openOperationLog'),
    action: () => {
      const event = new CustomEvent('openOperationLog');
      window.dispatchEvent(event);
    },
    category: SHORTCUT_CATEGORIES.HELP,
  },
];
