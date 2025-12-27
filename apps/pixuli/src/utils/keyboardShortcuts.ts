import { COMMON_SHORTCUTS, SHORTCUT_CATEGORIES } from '@packages/common/src';

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
    key: COMMON_SHORTCUTS.F1,
    description: t('keyboard.shortcuts.showHelp'),
    action: () => {
      const event = new CustomEvent('openKeyboardHelp');
      window.dispatchEvent(event);
    },
    category: SHORTCUT_CATEGORIES.HELP,
  },
  {
    key: COMMON_SHORTCUTS.F5,
    description: t('keyboard.shortcuts.refresh'),
    action: () => {
      const event = new CustomEvent('refreshImages');
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
  // 搜索快捷键
  {
    key: COMMON_SHORTCUTS.SLASH,
    description: t('keyboard.shortcuts.focusSearch'),
    action: () => {
      const searchInput = document.querySelector(
        'input[type="text"]',
      ) as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    },
    category: SHORTCUT_CATEGORIES.SEARCH,
  },
  {
    key: COMMON_SHORTCUTS.V,
    ctrlKey: true,
    description: t('keyboard.shortcuts.toggleView'),
    action: () => {
      const event = new CustomEvent('toggleViewMode');
      window.dispatchEvent(event);
    },
    category: SHORTCUT_CATEGORIES.IMAGE_BROWSER,
  },
];
