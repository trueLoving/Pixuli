/**
 * 操作日志存储适配器接口 - 三端统一
 * Web/Desktop 使用 localStorage，Mobile 使用 AsyncStorage
 */

export interface IOperationLogStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
