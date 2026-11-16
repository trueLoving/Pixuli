import { useEffect } from 'react';
import { keyboardManager } from '@/ui';
import { useUIStore } from '@/stores/uiStore';
import { createKeyboardShortcuts } from './keyboardShortcuts';

/**
 * 键盘快捷键管理 hooks
 */
export function useKeyboardShortcuts(
  t: (key: string) => string,
  showSettingsModal: boolean,
  handleCloseSettingsModal: () => void,
) {
  useEffect(() => {
    const shortcuts = createKeyboardShortcuts(t);
    keyboardManager.registerBatch(shortcuts);

    const handleCloseModals = () => {
      const ui = useUIStore.getState();
      if (ui.showKeyboardHelp) {
        ui.closeKeyboardHelp();
        return;
      }
      if (showSettingsModal) handleCloseSettingsModal();
    };

    window.addEventListener('closeModals', handleCloseModals);

    return () => {
      shortcuts.forEach(shortcut => keyboardManager.unregister(shortcut));
      window.removeEventListener('closeModals', handleCloseModals);
    };
  }, [t, showSettingsModal, handleCloseSettingsModal]);
}
