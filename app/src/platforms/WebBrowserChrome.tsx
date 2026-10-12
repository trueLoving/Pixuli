import React from 'react';
import { PWAInstallPrompt } from '@/features/pwa';
import { isWebBrowser } from './platform';

/** Web 浏览器专属壳层：PWA 安装/更新提示（Desktop / Capacitor 不渲染） */
export const WebBrowserChrome: React.FC = () => {
  if (!isWebBrowser()) {
    return null;
  }
  return (
    <>
      {/* OfflineIndicator 主路径打磨期暂隐：网络横幅易干扰，组件仍保留于 features/pwa */}
      <PWAInstallPrompt />
    </>
  );
};
