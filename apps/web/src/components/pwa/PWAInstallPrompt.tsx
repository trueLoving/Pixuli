import { Download, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/useI18n';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const { t } = useI18n();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

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
      // 已安装，不显示提示
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
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
      console.log('用户接受了安装提示');
    } else {
      console.log('用户拒绝了安装提示');
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
  }, []);

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
            aria-label={t('common.close') || '关闭'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
