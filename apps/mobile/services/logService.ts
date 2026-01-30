/**
 * 操作日志服务 - 移动端，使用 common 统一逻辑 + AsyncStorage 适配器
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  OperationLogService,
  type IOperationLogStorage,
} from '@packages/common/src/index.native';

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
