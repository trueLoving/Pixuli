import { Capacitor } from '@capacitor/core';

/**
 * 平台检测工具（Web / Desktop / Capacitor 壳内 mobile）
 */

export const isNativeMobile = (): boolean =>
  typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();

// 检测是否为 Web 平台
export const isWeb = (): boolean => {
  return typeof __IS_WEB__ !== 'undefined' ? __IS_WEB__ : false;
};

// 检测是否为 Desktop 平台
export const isDesktop = (): boolean => {
  return typeof __IS_DESKTOP__ !== 'undefined' ? __IS_DESKTOP__ : true;
};

// 获取平台类型
export const getPlatform = (): 'web' | 'desktop' | 'mobile' => {
  if (isWeb() && isNativeMobile()) {
    return 'mobile';
  }
  return isWeb() ? 'web' : 'desktop';
};
