import { Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/useI18n';

export function OfflineIndicator() {
  const { t } = useI18n();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      // 3 秒后自动隐藏
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) {
    return null;
  }

  return (
    <div
      className={`fixed top-16 left-0 right-0 z-50 px-4 py-3 transition-all duration-300 ${
        isOnline
          ? 'bg-green-50 border-b border-green-200'
          : 'bg-yellow-50 border-b border-yellow-200'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        {isOnline ? (
          <>
            <Wifi className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-800">
              {t('pwa.offline.online') || '网络连接已恢复'}
            </p>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              {t('pwa.offline.offline') ||
                '您当前处于离线状态，部分功能可能不可用'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
