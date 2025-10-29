import toast from 'react-hot-toast';

// 存储活跃的 toast 信息，用于语言切换时更新
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
  const toastId = toast.success(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      background: '#10b981',
      color: '#fff',
      fontSize: '14px',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
  });

  // 如果提供了 messageKey 或 getMessage，存储以便后续更新
  if (options?.messageKey || options?.getMessage) {
    const toastIdStr = String(toastId);
    activeToasts.set(toastIdStr, {
      id: toastIdStr,
      type: 'success',
      messageKey: options?.messageKey,
      getMessage: options?.getMessage,
    });
    // 在 duration 后自动清理记录
    setTimeout(() => {
      activeToasts.delete(toastIdStr);
    }, 3000);
  }

  return toastId;
};

// 错误消息提示
export const showError = (
  message: string,
  options?: { messageKey?: string; getMessage?: () => string }
) => {
  const toastId = toast.error(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#ef4444',
      color: '#fff',
      fontSize: '14px',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
  });

  if (options?.messageKey || options?.getMessage) {
    const toastIdStr = String(toastId);
    activeToasts.set(toastIdStr, {
      id: toastIdStr,
      type: 'error',
      messageKey: options?.messageKey,
      getMessage: options?.getMessage,
    });
    // 在 duration 后自动清理记录
    setTimeout(() => {
      activeToasts.delete(toastIdStr);
    }, 4000);
  }

  return toastId;
};

// 警告消息提示
export const showWarning = (
  message: string,
  options?: { messageKey?: string; getMessage?: () => string }
) => {
  const toastId = toast(message, {
    duration: 3000,
    position: 'top-right',
    icon: '⚠️',
    style: {
      background: '#f59e0b',
      color: '#fff',
      fontSize: '14px',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
  });

  if (options?.messageKey || options?.getMessage) {
    const toastIdStr = String(toastId);
    activeToasts.set(toastIdStr, {
      id: toastIdStr,
      type: 'warning',
      messageKey: options?.messageKey,
      getMessage: options?.getMessage,
    });
    // 在 duration 后自动清理记录
    setTimeout(() => {
      activeToasts.delete(toastIdStr);
    }, 3000);
  }

  return toastId;
};

// 信息消息提示
export const showInfo = (
  message: string,
  options?: { messageKey?: string; getMessage?: () => string }
) => {
  const toastId = toast(message, {
    duration: 3000,
    position: 'top-right',
    icon: 'ℹ️',
    style: {
      background: '#3b82f6',
      color: '#fff',
      fontSize: '14px',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
  });

  if (options?.messageKey || options?.getMessage) {
    const toastIdStr = String(toastId);
    activeToasts.set(toastIdStr, {
      id: toastIdStr,
      type: 'info',
      messageKey: options?.messageKey,
      getMessage: options?.getMessage,
    });
    // 在 duration 后自动清理记录
    setTimeout(() => {
      activeToasts.delete(toastIdStr);
    }, 3000);
  }

  return toastId;
};

// 加载中消息提示（不设置自动清理，因为 loading toast 通常会被 updateLoadingToSuccess 或 updateLoadingToError 更新）
export const showLoading = (
  message: string,
  options?: { messageKey?: string; getMessage?: () => string }
) => {
  const toastId = toast.loading(message, {
    position: 'top-right',
    style: {
      background: '#6b7280',
      color: '#fff',
      fontSize: '14px',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
  });

  if (options?.messageKey || options?.getMessage) {
    activeToasts.set(String(toastId), {
      id: String(toastId),
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
  // 移除旧的 loading toast 信息
  activeToasts.delete(toastId);

  toast.success(message, {
    id: toastId,
    duration: 3000,
    style: {
      background: '#10b981',
      color: '#fff',
      fontSize: '14px',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
  });

  if (options?.messageKey || options?.getMessage) {
    activeToasts.set(toastId, {
      id: toastId,
      type: 'success',
      messageKey: options?.messageKey,
      getMessage: options?.getMessage,
    });
    // 在 duration 后自动清理记录
    setTimeout(() => {
      activeToasts.delete(toastId);
    }, 3000);
  }
};

// 更新加载中消息为错误
export const updateLoadingToError = (
  toastId: string,
  message: string,
  options?: { messageKey?: string; getMessage?: () => string }
) => {
  // 移除旧的 loading toast 信息
  activeToasts.delete(toastId);

  toast.error(message, {
    id: toastId,
    duration: 4000,
    style: {
      background: '#ef4444',
      color: '#fff',
      fontSize: '14px',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
  });

  if (options?.messageKey || options?.getMessage) {
    activeToasts.set(toastId, {
      id: toastId,
      type: 'error',
      messageKey: options?.messageKey,
      getMessage: options?.getMessage,
    });
    // 在 duration 后自动清理记录
    setTimeout(() => {
      activeToasts.delete(toastId);
    }, 4000);
  }
};

/**
 * 更新所有活跃的 toast 消息（用于语言切换）
 * @param translate 翻译函数
 */
export const updateAllToasts = (translate: (key: string) => string) => {
  // 创建副本以避免在迭代时修改 Map
  const toastsToUpdate = Array.from(activeToasts.entries());

  toastsToUpdate.forEach(([toastId, toastInfo]) => {
    let newMessage: string;

    if (toastInfo.getMessage) {
      // 使用 getMessage 函数获取新的消息
      newMessage = toastInfo.getMessage();
    } else if (toastInfo.messageKey) {
      // 使用 messageKey 通过翻译函数获取新消息
      newMessage = translate(toastInfo.messageKey);
    } else {
      // 如果没有提供更新方式，跳过
      return;
    }

    // 根据类型更新 toast
    // 使用相同的 id 更新现有 toast，如果 toast 已经消失，这个更新会被忽略
    switch (toastInfo.type) {
      case 'success':
        toast.success(newMessage, {
          id: toastId,
          duration: 3000,
          style: {
            background: '#10b981',
            color: '#fff',
            fontSize: '14px',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        });
        // 在 duration 后自动清理记录
        setTimeout(() => {
          activeToasts.delete(toastId);
        }, 3000);
        break;
      case 'error':
        toast.error(newMessage, {
          id: toastId,
          duration: 4000,
          style: {
            background: '#ef4444',
            color: '#fff',
            fontSize: '14px',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        });
        // 在 duration 后自动清理记录
        setTimeout(() => {
          activeToasts.delete(toastId);
        }, 4000);
        break;
      case 'warning':
        toast(newMessage, {
          id: toastId,
          duration: 3000,
          icon: '⚠️',
          style: {
            background: '#f59e0b',
            color: '#fff',
            fontSize: '14px',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        });
        // 在 duration 后自动清理记录
        setTimeout(() => {
          activeToasts.delete(toastId);
        }, 3000);
        break;
      case 'info':
        toast(newMessage, {
          id: toastId,
          duration: 3000,
          icon: 'ℹ️',
          style: {
            background: '#3b82f6',
            color: '#fff',
            fontSize: '14px',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        });
        // 在 duration 后自动清理记录
        setTimeout(() => {
          activeToasts.delete(toastId);
        }, 3000);
        break;
      case 'loading':
        toast.loading(newMessage, {
          id: toastId,
          position: 'top-right',
          style: {
            background: '#6b7280',
            color: '#fff',
            fontSize: '14px',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        });
        // loading toast 不设置自动清理，因为它可能被 updateLoadingToSuccess/Error 更新
        break;
    }
  });
};

/**
 * 清除所有活跃的 toast 记录（当 toast 自动消失时调用）
 */
export const clearToastRecord = (toastId: string) => {
  activeToasts.delete(String(toastId));
};

/**
 * 清除所有活跃的 toast
 */
export const dismissAllToasts = () => {
  activeToasts.clear();
  toast.dismiss();
};
