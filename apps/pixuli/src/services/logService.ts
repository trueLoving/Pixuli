/**
 * 操作日志服务 - Web/Desktop 端，使用 common 统一逻辑 + localStorage 适配器
 */

import {
  OperationLogService,
  type IOperationLogStorage,
} from '@packages/common/src';

const STORAGE_KEY = 'pixuli-operation-logs';

const webStorageAdapter: IOperationLogStorage = {
  getItem: (key: string) =>
    Promise.resolve(
      typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null,
    ),
  setItem: (key: string, value: string) => {
    if (typeof localStorage === 'undefined') return Promise.resolve();
    try {
      localStorage.setItem(key, value);
      return Promise.resolve();
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.error('LocalStorage quota exceeded');
      }
      return Promise.reject(e);
    }
  },
};

let instance: OperationLogService | null = null;

export function getLogService(): OperationLogService {
  if (!instance) {
    instance = new OperationLogService(webStorageAdapter, {
      storageKey: STORAGE_KEY,
      maxLogs: 10000,
    });
  }
  return instance;
}

/** @deprecated 使用 getLogService()，保留单例 getInstance 兼容 */
export const LogService = {
  getInstance(): OperationLogService {
    return getLogService();
  },
};
