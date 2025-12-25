import { useEffect } from 'react';
import { keyboardManager } from '@packages/common/src';
import { createKeyboardShortcuts } from '../utils-web/keyboardShortcuts';

/**
 * 键盘快捷键管理 hooks
 */
export function useKeyboardShortcuts(
  t: (key: string) => string,
  showConfigModal: boolean,
  showKeyboardHelp: boolean,
  showVersionInfo: boolean,
  handleCloseConfigModal: () => void,
  handleOpenKeyboardHelp: () => void,
  handleOpenVersionInfo: () => void,
  handleCloseKeyboardHelp: () => void,
  handleCloseVersionInfo: () => void,
  handleLoadImages: () => Promise<void>,
  handleOpenConfigModal: () => void,
) {
  useEffect(() => {
    const shortcuts = createKeyboardShortcuts(t);
    keyboardManager.registerBatch(shortcuts);

    const handleCloseModals = () => {
      if (showConfigModal) handleCloseConfigModal();
      else if (showKeyboardHelp) handleCloseKeyboardHelp();
      else if (showVersionInfo) handleCloseVersionInfo();
    };

    const handleOpenKeyboardHelpEvent = () => handleOpenKeyboardHelp();
    const handleOpenVersionInfoEvent = () => handleOpenVersionInfo();
    const handleRefreshImages = () => handleLoadImages();
    const handleOpenConfig = () => handleOpenConfigModal();

    window.addEventListener('closeModals', handleCloseModals);
    window.addEventListener('openKeyboardHelp', handleOpenKeyboardHelpEvent);
    window.addEventListener('openVersionInfo', handleOpenVersionInfoEvent);
    window.addEventListener('refreshImages', handleRefreshImages);
    window.addEventListener('openConfig', handleOpenConfig);

    return () => {
      shortcuts.forEach(shortcut => keyboardManager.unregister(shortcut));
      window.removeEventListener('closeModals', handleCloseModals);
      window.removeEventListener(
        'openKeyboardHelp',
        handleOpenKeyboardHelpEvent,
      );
      window.removeEventListener('openVersionInfo', handleOpenVersionInfoEvent);
      window.removeEventListener('refreshImages', handleRefreshImages);
      window.removeEventListener('openConfig', handleOpenConfig);
    };
  }, [
    t,
    showConfigModal,
    showKeyboardHelp,
    showVersionInfo,
    handleCloseConfigModal,
    handleOpenKeyboardHelp,
    handleOpenVersionInfo,
    handleCloseKeyboardHelp,
    handleCloseVersionInfo,
    handleLoadImages,
    handleOpenConfigModal,
  ]);
}
