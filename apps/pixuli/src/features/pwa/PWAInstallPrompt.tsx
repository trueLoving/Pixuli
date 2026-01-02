import { Download, X } from 'lucide-react';
// TODO: 暂时注释掉 RefreshCw 和更新相关导入，待问题修复后恢复
// import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/useI18n';
// TODO: 暂时注释掉 pwaService 导入，待更新功能恢复后启用
// import { pwaService } from '../../platforms/web/services/pwaService';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const { t } = useI18n();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  // TODO: 暂时注释掉更新相关状态，待问题修复后恢复
  // const [showUpdate, setShowUpdate] = useState(false);
  // const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // 阻止默认的安装提示
      e.preventDefault();
      // 保存事件以便后续使用
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // 显示自定义安装提示
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // 检查是否已经安装
    if (window.matchMedia('(display-mode: standalone)').matches) {
      // 已安装，不显示安装提示
      setShowPrompt(false);
    }

    // TODO: 暂时注释掉 Service Worker 更新监听，待问题修复后恢复
    /*
    // 监听 Service Worker 更新
    pwaService.on('updateAvailable', () => {
      setShowUpdate(true);
    });
    */

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      // TODO: 暂时注释掉更新事件监听清理
      // pwaService.off('updateAvailable', () => {});
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    // 显示安装提示
    deferredPrompt.prompt();

    // 等待用户响应
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted install prompt');
    } else {
      console.log('[PWA] User dismissed install prompt');
    }

    // 清除保存的提示
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // 保存到 localStorage，24 小时内不再显示
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // TODO: 暂时注释掉更新相关处理函数，待问题修复后恢复
  /*
  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await pwaService.skipWaiting();
      // Service Worker 更新后会自动重新加载页面
      // 如果没有等待中的 Service Worker，skipWaiting 会直接刷新页面
      // 所以这里不需要额外处理
    } catch (error) {
      console.error('[PWA] Update failed:', error);
      setIsUpdating(false);

      // 如果更新失败，尝试直接刷新页面
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes('No waiting') ||
        errorMessage.includes('already active')
      ) {
        // 没有等待中的 Service Worker，可能已经是最新版本，直接刷新
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    }
  };

  const handleDismissUpdate = () => {
    setShowUpdate(false);
    localStorage.setItem('pwa-update-dismissed', Date.now().toString());
  };
  */

  // 检查是否在 24 小时内已关闭过提示
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      if (now - dismissedTime < oneDay) {
        setShowPrompt(false);
      }
    }

    // TODO: 暂时注释掉更新提示的 localStorage 检查，待问题修复后恢复
    /*
    const updateDismissed = localStorage.getItem('pwa-update-dismissed');
    if (updateDismissed) {
      const dismissedTime = parseInt(updateDismissed, 10);
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      if (now - dismissedTime < oneDay) {
        setShowUpdate(false);
      }
    }
    */
  }, []);

  // TODO: 暂时注释掉更新提示 UI，待问题修复后恢复
  /*
  // 显示更新提示
  if (showUpdate) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50">
        <div className="bg-white rounded-lg shadow-lg border border-blue-200 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <RefreshCw
                className={`w-5 h-5 text-blue-600 ${isUpdating ? 'animate-spin' : ''}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {t('pwa.update.title') || '应用更新'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t('pwa.update.description') || '点击更新以获取最新功能'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {t('pwa.update.button') || '更新'}
            </button>
            <button
              onClick={handleDismissUpdate}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              aria-label={t('pwa.update.later') || '稍后'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }
  */

  // 显示安装提示
  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {t('pwa.install.title') || '安装 Pixuli'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {t('pwa.install.description') || '安装到主屏幕，获得更好的体验'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleInstall}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {t('pwa.install.button') || '安装'}
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            aria-label={t('pwa.install.dismiss') || '稍后'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
