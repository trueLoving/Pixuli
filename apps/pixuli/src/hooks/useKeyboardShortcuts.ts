import { useEffect } from 'react';
import { keyboardManager } from '@packages/common/src';
import { createKeyboardShortcuts } from '../utils/keyboardShortcuts';

/**
 * 键盘快捷键管理 hooks
 */
export function useKeyboardShortcuts(
  t: (key: string) => string,
  showConfigModal: boolean,
  showKeyboardHelp: boolean,
  showVersionInfo: boolean,
  showOperationLog: boolean,
  handleCloseConfigModal: () => void,
  handleOpenKeyboardHelp: () => void,
  handleOpenVersionInfo: () => void,
  handleCloseKeyboardHelp: () => void,
  handleCloseVersionInfo: () => void,
  handleOpenOperationLog: () => void,
  handleCloseOperationLog: () => void,
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
      else if (showOperationLog) handleCloseOperationLog();
    };

    const handleOpenKeyboardHelpEvent = () => handleOpenKeyboardHelp();
    const handleOpenVersionInfoEvent = () => handleOpenVersionInfo();
    const handleOpenOperationLogEvent = () => handleOpenOperationLog();
    const handleRefreshImages = () => handleLoadImages();
    const handleOpenConfig = () => handleOpenConfigModal();

    window.addEventListener('closeModals', handleCloseModals);
    window.addEventListener('openKeyboardHelp', handleOpenKeyboardHelpEvent);
    window.addEventListener('openVersionInfo', handleOpenVersionInfoEvent);
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
      window.removeEventListener('openVersionInfo', handleOpenVersionInfoEvent);
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
    showKeyboardHelp,
    showVersionInfo,
    showOperationLog,
    handleCloseConfigModal,
    handleOpenKeyboardHelp,
    handleOpenVersionInfo,
    handleCloseKeyboardHelp,
    handleCloseVersionInfo,
    handleOpenOperationLog,
    handleCloseOperationLog,
    handleLoadImages,
    handleOpenConfigModal,
  ]);
}
