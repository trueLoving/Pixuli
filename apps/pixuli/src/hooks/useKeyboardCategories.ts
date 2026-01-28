import { useMemo } from 'react';

/**
 * 键盘快捷键分类数据 hooks
 */
export function useKeyboardCategories(t: (key: string) => string) {
  return useMemo(
    () => [
      {
        name: t('keyboard.categories.general'),
        shortcuts: [
          { description: t('keyboard.shortcuts.closeModal'), key: 'Escape' },
          { description: t('keyboard.shortcuts.showHelp'), key: 'F1' },
          { description: t('keyboard.shortcuts.refresh'), key: 'F5' },
          {
            description: t('keyboard.shortcuts.openConfig'),
            key: ',',
            ctrlKey: true,
          },
          { description: t('keyboard.shortcuts.focusSearch'), key: '/' },
          {
            description: t('keyboard.shortcuts.toggleView'),
            key: 'V',
            ctrlKey: true,
          },
          {
            description: t('keyboard.shortcuts.openOperationLog'),
            key: 'L',
            ctrlKey: true,
            shiftKey: true,
          },
        ],
      },
      {
        name: t('keyboard.categories.browsing'),
        shortcuts: [
          { description: t('keyboard.shortcuts.selectUp'), key: 'ArrowUp' },
          { description: t('keyboard.shortcuts.selectDown'), key: 'ArrowDown' },
          { description: t('keyboard.shortcuts.selectLeft'), key: 'ArrowLeft' },
          {
            description: t('keyboard.shortcuts.selectRight'),
            key: 'ArrowRight',
          },
          { description: t('keyboard.shortcuts.openSelected'), key: 'Enter' },
        ],
      },
    ],
    [t],
  );
}
