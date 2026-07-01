import { useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';
import { isNativeMobile } from '@/platforms/platform';

const OVERLAY_CLOSE_SELECTORS = [
  '.image-preview-modal-overlay .image-preview-modal-close',
  '.image-upload-modal-overlay .image-upload-modal-close',
  '.image-batch-delete-modal-overlay .image-batch-delete-modal-close',
  '.image-crop-modal-overlay .image-crop-modal-close',
].join(', ');

function dismissDomOverlay(): boolean {
  const closeBtn = document.querySelector(
    OVERLAY_CLOSE_SELECTORS,
  ) as HTMLButtonElement | null;
  if (closeBtn) {
    closeBtn.click();
    return true;
  }
  return false;
}

function dismissFilterPanel(): boolean {
  const panel = document.querySelector('.search-filter-panel');
  if (!panel) return false;
  window.dispatchEvent(new CustomEvent('pixuli:closeFilterPanel'));
  return true;
}

/**
 * Android 硬件返回键：先关顶层弹层/抽屉，再交还系统默认行为。
 * REF-512 #150
 */
export function useCapacitorBackButton(): void {
  useEffect(() => {
    if (!isNativeMobile()) return;

    let removed = false;
    let handle: { remove: () => Promise<void> } | undefined;

    void (async () => {
      const { App } = await import('@capacitor/app');
      if (removed) return;

      handle = await App.addListener('backButton', ({ canGoBack }) => {
        const ui = useUIStore.getState();

        if (ui.showConfigModal) {
          ui.closeConfigModal();
          return;
        }
        if (ui.showSettingsModal) {
          ui.closeSettingsModal();
          return;
        }
        if (dismissDomOverlay()) return;
        if (dismissFilterPanel()) return;
        if (ui.mobileSidebarOpen) {
          ui.closeMobileSidebar();
          return;
        }
        if (canGoBack) {
          window.history.back();
        } else {
          void App.minimizeApp();
        }
      });
    })();

    return () => {
      removed = true;
      void handle?.remove();
    };
  }, []);
}
