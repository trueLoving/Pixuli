import { useEffect } from 'react';
import { isWebBrowser } from './platform';

/**
 * Web 浏览器专属壳层（Desktop / Capacitor 不处理）。
 * 安装与更新弹窗主路径暂隐：组件仍保留于 features/pwa。
 * 拦住 beforeinstallprompt，避免浏览器再弹出自己的安装条。
 */
export const WebBrowserChrome: React.FC = () => {
  useEffect(() => {
    if (!isWebBrowser()) return;
    const handler = (event: Event) => {
      event.preventDefault();
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  return null;
};
