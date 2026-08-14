import React from 'react';
import { OfflineIndicator, PWAInstallPrompt } from '../features';
import { isWebBrowser } from './platform';

/** Web 浏览器专属壳层：离线指示与 PWA 安装提示（Desktop / Capacitor 不渲染） */
export const WebBrowserChrome: React.FC = () => {
  if (!isWebBrowser()) {
    return null;
  }
  return (
    <>
      <OfflineIndicator />
      <PWAInstallPrompt />
    </>
  );
};
