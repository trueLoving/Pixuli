import { useEffect } from 'react';
import { keyboardManager } from '@/ui';
import { createKeyboardShortcuts } from './keyboardShortcuts';

/**
 * 键盘快捷键管理 hooks
 */
export function useKeyboardShortcuts(
  t: (key: string) => string,
  showSettingsModal: boolean,
  handleCloseSettingsModal: () => void,
  handleOpenOperationLog: () => void,
  handleLoadAssets: () => Promise<void>,
  handleOpenConfigModal: () => void,
) {
  useEffect(() => {
    const shortcuts = createKeyboardShortcuts(t);
    keyboardManager.registerBatch(shortcuts);

    const handleCloseModals = () => {
      if (showSettingsModal) handleCloseSettingsModal();
    };

    const handleOpenOperationLogEvent = () => handleOpenOperationLog();
    const handleRefreshAssets = () => handleLoadAssets();
    const handleOpenConfig = () => handleOpenConfigModal();

    window.addEventListener('closeModals', handleCloseModals);
    window.addEventListener('openOperationLog', handleOpenOperationLogEvent);
    window.addEventListener('refreshAssets', handleRefreshAssets);
    window.addEventListener('openConfig', handleOpenConfig);

    return () => {
      shortcuts.forEach(shortcut => keyboardManager.unregister(shortcut));
      window.removeEventListener('closeModals', handleCloseModals);
      window.removeEventListener(
        'openOperationLog',
        handleOpenOperationLogEvent,
      );
      window.removeEventListener('refreshAssets', handleRefreshAssets);
      window.removeEventListener('openConfig', handleOpenConfig);
    };
  }, [
    t,
    showSettingsModal,
    handleCloseSettingsModal,
    handleOpenOperationLog,
    handleLoadAssets,
    handleOpenConfigModal,
  ]);
}
