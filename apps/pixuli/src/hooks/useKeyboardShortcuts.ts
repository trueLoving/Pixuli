import { useEffect } from 'react';
import { keyboardManager } from '@pixuli/ui';
import { createKeyboardShortcuts } from '../utils/keyboardShortcuts';

/**
 * 键盘快捷键管理 hooks
 */
export function useKeyboardShortcuts(
  t: (key: string) => string,
  showConfigModal: boolean,
  showOperationLog: boolean,
  showSettingsModal: boolean,
  handleCloseConfigModal: () => void,
  handleCloseOperationLog: () => void,
  handleCloseSettingsModal: () => void,
  handleOpenKeyboardHelp: () => void,
  handleLoadImages: () => Promise<void>,
  handleOpenConfigModal: () => void,
) {
  useEffect(() => {
    const shortcuts = createKeyboardShortcuts(t);
    keyboardManager.registerBatch(shortcuts);

    const handleCloseModals = () => {
      if (showConfigModal) handleCloseConfigModal();
      else if (showSettingsModal) handleCloseSettingsModal();
      else if (showOperationLog) handleCloseOperationLog();
    };

    const handleOpenKeyboardHelpEvent = () => handleOpenKeyboardHelp();
    const handleRefreshImages = () => handleLoadImages();
    const handleOpenConfig = () => handleOpenConfigModal();

    window.addEventListener('closeModals', handleCloseModals);
    window.addEventListener('openKeyboardHelp', handleOpenKeyboardHelpEvent);
    window.addEventListener('refreshImages', handleRefreshImages);
    window.addEventListener('openConfig', handleOpenConfig);

    return () => {
      shortcuts.forEach(shortcut => keyboardManager.unregister(shortcut));
      window.removeEventListener('closeModals', handleCloseModals);
      window.removeEventListener(
        'openKeyboardHelp',
        handleOpenKeyboardHelpEvent,
      );
      window.removeEventListener('refreshImages', handleRefreshImages);
      window.removeEventListener('openConfig', handleOpenConfig);
    };
  }, [
    t,
    showConfigModal,
    showOperationLog,
    showSettingsModal,
    handleCloseConfigModal,
    handleCloseOperationLog,
    handleCloseSettingsModal,
    handleOpenKeyboardHelp,
    handleLoadImages,
    handleOpenConfigModal,
  ]);
}
