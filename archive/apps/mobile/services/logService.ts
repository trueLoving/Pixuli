/**
 * 操作日志服务 - 移动端，@pixuli/core/operation-log + AsyncStorage 适配器
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  OperationLogService,
  type IOperationLogStorage,
} from '@pixuli/core/operation-log';

const STORAGE_KEY = 'pixuli-operation-logs';

const mobileStorageAdapter: IOperationLogStorage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
};

let instance: OperationLogService | null = null;

export function getLogService(): OperationLogService {
  if (!instance) {
    instance = new OperationLogService(mobileStorageAdapter, {
      storageKey: STORAGE_KEY,
      maxLogs: 10000,
    });
  }
  return instance;
}
