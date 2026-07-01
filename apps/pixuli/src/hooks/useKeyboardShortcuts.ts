import { useEffect } from 'react';
import { keyboardManager } from '@pixuli/ui';
import { createKeyboardShortcuts } from '../utils/keyboardShortcuts';

/**
 * 键盘快捷键管理 hooks
 */
export function useKeyboardShortcuts(
  t: (key: string) => string,
  showConfigModal: boolean,
  showSettingsModal: boolean,
  handleCloseConfigModal: () => void,
  handleCloseSettingsModal: () => void,
  handleOpenKeyboardHelp: () => void,
  handleOpenOperationLog: () => void,
  handleLoadImages: () => Promise<void>,
  handleOpenConfigModal: () => void,
) {
  useEffect(() => {
    const shortcuts = createKeyboardShortcuts(t);
    keyboardManager.registerBatch(shortcuts);

    const handleCloseModals = () => {
      if (showConfigModal) handleCloseConfigModal();
      else if (showSettingsModal) handleCloseSettingsModal();
    };

    const handleOpenKeyboardHelpEvent = () => handleOpenKeyboardHelp();
    const handleOpenOperationLogEvent = () => handleOpenOperationLog();
    const handleRefreshImages = () => handleLoadImages();
    const handleOpenConfig = () => handleOpenConfigModal();

    window.addEventListener('closeModals', handleCloseModals);
    window.addEventListener('openKeyboardHelp', handleOpenKeyboardHelpEvent);
    window.addEventListener('openOperationLog', handleOpenOperationLogEvent);
    window.addEventListener('refreshImages', handleRefreshImages);
    window.addEventListener('openConfig', handleOpenConfig);

    return () => {
      shortcuts.forEach(shortcut => keyboardManager.unregister(shortcut));
      window.removeEventListener('closeModals', handleCloseModals);
      window.removeEventListener(
        'openKeyboardHelp',
        handleOpenKeyboardHelpEvent,
      );
      window.removeEventListener(
        'openOperationLog',
        handleOpenOperationLogEvent,
      );
      window.removeEventListener('refreshImages', handleRefreshImages);
      window.removeEventListener('openConfig', handleOpenConfig);
    };
  }, [
    t,
    showConfigModal,
    showSettingsModal,
    handleCloseConfigModal,
    handleCloseSettingsModal,
    handleOpenKeyboardHelp,
    handleOpenOperationLog,
    handleLoadImages,
    handleOpenConfigModal,
  ]);
}
