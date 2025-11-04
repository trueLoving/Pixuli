/**
 * React Native 版本的 Toast 工具函数
 * 使用 Alert 替代 react-hot-toast
 */

import { Alert } from 'react-native';

// 存储活跃的 toast 信息（用于兼容接口，但移动端不使用）
interface ToastInfo {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'loading';
  messageKey?: string;
  getMessage?: () => string;
}

const activeToasts = new Map<string, ToastInfo>();

// 成功消息提示
export const showSuccess = (
  message: string,
  options?: { messageKey?: string; getMessage?: () => string }
) => {
  Alert.alert('成功', message);
  const toastId = `success-${Date.now()}`;
  if (options?.messageKey || options?.getMessage) {
    activeToasts.set(toastId, {
      id: toastId,
      type: 'success',
      messageKey: options?.messageKey,
      getMessage: options?.getMessage,
    });
  }
  return toastId;
};

// 错误消息提示
export const showError = (
  message: string,
  options?: { messageKey?: string; getMessage?: () => string }
) => {
  Alert.alert('错误', message);
  const toastId = `error-${Date.now()}`;
  if (options?.messageKey || options?.getMessage) {
    activeToasts.set(toastId, {
      id: toastId,
      type: 'error',
      messageKey: options?.messageKey,
      getMessage: options?.getMessage,
    });
  }
  return toastId;
};

// 警告消息提示
export const showWarning = (
  message: string,
  options?: { messageKey?: string; getMessage?: () => string }
) => {
  Alert.alert('警告', message);
  const toastId = `warning-${Date.now()}`;
  if (options?.messageKey || options?.getMessage) {
    activeToasts.set(toastId, {
      id: toastId,
      type: 'warning',
      messageKey: options?.messageKey,
      getMessage: options?.getMessage,
    });
  }
  return toastId;
};

// 信息消息提示
export const showInfo = (
  message: string,
  options?: { messageKey?: string; getMessage?: () => string }
) => {
  Alert.alert('提示', message);
  const toastId = `info-${Date.now()}`;
  if (options?.messageKey || options?.getMessage) {
    activeToasts.set(toastId, {
      id: toastId,
      type: 'info',
      messageKey: options?.messageKey,
      getMessage: options?.getMessage,
    });
  }
  return toastId;
};

// 加载中消息提示（移动端使用 Alert，不显示 loading）
export const showLoading = (
  message: string,
  options?: { messageKey?: string; getMessage?: () => string }
) => {
  // 移动端不显示 loading Alert，只在内存中记录
  const toastId = `loading-${Date.now()}`;
  if (options?.messageKey || options?.getMessage) {
    activeToasts.set(toastId, {
      id: toastId,
      type: 'loading',
      messageKey: options?.messageKey,
      getMessage: options?.getMessage,
    });
  }
  return toastId;
};

// 更新加载中消息为成功
export const updateLoadingToSuccess = (
  toastId: string,
  message: string,
  options?: { messageKey?: string; getMessage?: () => string }
) => {
  activeToasts.delete(toastId);
  Alert.alert('成功', message);
  if (options?.messageKey || options?.getMessage) {
    activeToasts.set(toastId, {
      id: toastId,
      type: 'success',
      messageKey: options?.messageKey,
      getMessage: options?.getMessage,
    });
  }
};

// 更新加载中消息为错误
export const updateLoadingToError = (
  toastId: string,
  message: string,
  options?: { messageKey?: string; getMessage?: () => string }
) => {
  activeToasts.delete(toastId);
  Alert.alert('错误', message);
  if (options?.messageKey || options?.getMessage) {
    activeToasts.set(toastId, {
      id: toastId,
      type: 'error',
      messageKey: options?.messageKey,
      getMessage: options?.getMessage,
    });
  }
};

/**
 * 更新所有活跃的 toast 消息（用于语言切换）
 * 移动端实现为空，因为 Alert 不支持动态更新
 */
export const updateAllToasts = (translate: (key: string) => string) => {
  // 移动端使用 Alert，不支持动态更新已显示的 toast
  // 这个方法主要用于兼容接口
  const toastsToUpdate = Array.from(activeToasts.entries());
  toastsToUpdate.forEach(([toastId, toastInfo]) => {
    let newMessage: string;

    if (toastInfo.getMessage) {
      newMessage = toastInfo.getMessage();
    } else if (toastInfo.messageKey) {
      newMessage = translate(toastInfo.messageKey);
    } else {
      return;
    }

    // 移动端 Alert 不支持更新，所以这里不做任何操作
    // 只是更新内存中的记录
    activeToasts.set(toastId, {
      ...toastInfo,
      messageKey: toastInfo.messageKey,
      getMessage: toastInfo.getMessage,
    });
  });
};

/**
 * 清除所有活跃的 toast 记录
 */
export const clearToastRecord = (toastId: string) => {
  activeToasts.delete(String(toastId));
};

/**
 * 清除所有活跃的 toast
 */
export const dismissAllToasts = () => {
  activeToasts.clear();
  // Alert 不支持 dismiss，所以这里只清理内存记录
};
