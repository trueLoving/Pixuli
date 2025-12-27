/**
 * 平台检测工具
 */

// 检测是否为 Web 平台
export const isWeb = (): boolean => {
  return typeof __IS_WEB__ !== 'undefined' ? __IS_WEB__ : false;
};

// 检测是否为 Desktop 平台
export const isDesktop = (): boolean => {
  return typeof __IS_DESKTOP__ !== 'undefined' ? __IS_DESKTOP__ : true;
};

// 获取平台类型
export const getPlatform = (): 'web' | 'desktop' => {
  return isWeb() ? 'web' : 'desktop';
};
