import { Wifi, WifiOff, Database } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/useI18n';
import { backgroundSyncService } from '../../platforms/web/services/backgroundSyncService';
// TODO: 暂时注释掉 pwaService 导入，待缓存功能恢复后启用
// import { pwaService } from '../../platforms/web/services/pwaService';

export function OfflineIndicator() {
  const { t } = useI18n();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [cacheSize, setCacheSize] = useState<number | null>(null);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setShowBanner(true);

      // 检查待同步操作
      try {
        await backgroundSyncService.init();
        const count = await backgroundSyncService.getPendingCount();
        setPendingSyncCount(count);
      } catch (error) {
        console.error('[OfflineIndicator] Failed to get pending count:', error);
      }

      // 3 秒后自动隐藏
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = async () => {
      setIsOnline(false);
      setShowBanner(true);

      // TODO: 暂时注释掉获取缓存大小，待缓存功能恢复后启用
      /*
      // 获取缓存大小
      try {
        const size = await pwaService.getCacheSize();
        setCacheSize(size);
      } catch (error) {
        console.error('[OfflineIndicator] Failed to get cache size:', error);
      }
      */
      setCacheSize(null);
    };

    // 初始化时检查状态
    if (!navigator.onLine) {
      handleOffline();
    } else {
      handleOnline();
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 定期检查待同步操作
    const syncCheckInterval = setInterval(async () => {
      if (navigator.onLine) {
        try {
          await backgroundSyncService.init();
          const count = await backgroundSyncService.getPendingCount();
          setPendingSyncCount(count);
          if (count > 0) {
            setShowBanner(true);
          }
        } catch (error) {
          console.error('[OfflineIndicator] Failed to check sync:', error);
        }
      }
    }, 30000); // 每30秒检查一次

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncCheckInterval);
    };
  }, []);

  const formatCacheSize = (bytes: number | null): string => {
    if (bytes === null) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div
      className={`fixed top-16 left-0 right-0 z-50 px-4 py-3 transition-all duration-300 ${
        isOnline
          ? pendingSyncCount > 0
            ? 'bg-blue-50 border-b border-blue-200'
            : 'bg-green-50 border-b border-green-200'
          : 'bg-yellow-50 border-b border-yellow-200'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        {isOnline ? (
          <>
            {pendingSyncCount > 0 ? (
              <>
                <Database className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-blue-800">
                  {t('pwa.sync.pending', { count: pendingSyncCount }) ||
                    `有 ${pendingSyncCount} 个操作待同步`}
                </p>
              </>
            ) : (
              <>
                <Wifi className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-800">
                  {t('pwa.offline.online') || '网络连接已恢复'}
                </p>
              </>
            )}
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800">
                {t('pwa.offline.offline') ||
                  '您当前处于离线状态，部分功能可能不可用'}
              </p>
              {cacheSize !== null && (
                <p className="text-xs text-yellow-700 mt-1">
                  {t('pwa.offline.cachedImages') || '已缓存图片'}:{' '}
                  {formatCacheSize(cacheSize)}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
