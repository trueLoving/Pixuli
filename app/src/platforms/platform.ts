import { Capacitor } from '@capacitor/core';

/**
 * 三端平台检测（Web 浏览器 / Electron Desktop / Capacitor Android）。
 * Vite 在构建时注入 `__IS_WEB__` / `__IS_DESKTOP__`；Capacitor 在运行时区分壳内 mobile。
 */

export const isNativeMobile = (): boolean =>
  typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();

export const isWeb = (): boolean =>
  typeof __IS_WEB__ !== 'undefined' ? __IS_WEB__ : false;

export const isDesktop = (): boolean =>
  typeof __IS_DESKTOP__ !== 'undefined' ? __IS_DESKTOP__ : true;

/** Web 浏览器（含 PWA），不含 Capacitor WebView */
export const isWebBrowser = (): boolean => isWeb() && !isNativeMobile();

export const getPlatform = (): 'web' | 'desktop' | 'mobile' => {
  if (isWeb() && isNativeMobile()) {
    return 'mobile';
  }
  return isWeb() ? 'web' : 'desktop';
};
