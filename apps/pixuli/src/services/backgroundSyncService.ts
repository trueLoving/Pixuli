/**
 * 后台同步服务
 * 处理离线操作的后台同步
 */

import { pwaService } from '../services/pwaService';

export interface PendingOperation {
  id: string;
  type: 'upload' | 'delete' | 'update';
  data: any;
  timestamp: number;
  retries: number;
}

const DB_NAME = 'pixuli-sync';
const DB_VERSION = 1;
const STORE_NAME = 'pending-operations';

class BackgroundSyncService {
  private db: IDBDatabase | null = null;

  /**
   * 初始化 IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[BackgroundSync] Failed to open IndexedDB');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[BackgroundSync] IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建对象存储
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
          });
          objectStore.createIndex('type', 'type', { unique: false });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * 添加待同步操作
   */
  async addPendingOperation(
    operation: Omit<PendingOperation, 'id' | 'retries'>,
  ): Promise<string> {
    if (!this.db) {
      await this.init();
    }

    const id = `${operation.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const pendingOperation: PendingOperation = {
      id,
      ...operation,
      retries: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(pendingOperation);

      request.onsuccess = () => {
        console.log('[BackgroundSync] Operation added:', id);
        // 注册后台同步
        pwaService.registerBackgroundSync('sync-images');
        resolve(id);
      };

      request.onerror = () => {
        console.error(
          '[BackgroundSync] Failed to add operation:',
          request.error,
        );
        reject(request.error);
      };
    });
  }

  /**
   * 获取所有待同步操作
   */
  async getPendingOperations(): Promise<PendingOperation[]> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error(
          '[BackgroundSync] Failed to get operations:',
          request.error,
        );
        reject(request.error);
      };
    });
  }

  /**
   * 获取指定类型的待同步操作
   */
  async getPendingOperationsByType(
    type: PendingOperation['type'],
  ): Promise<PendingOperation[]> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('type');
      const request = index.getAll(type);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error(
          '[BackgroundSync] Failed to get operations by type:',
          request.error,
        );
        reject(request.error);
      };
    });
  }

  /**
   * 移除待同步操作
   */
  async removePendingOperation(id: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('[BackgroundSync] Operation removed:', id);
        resolve();
      };

      request.onerror = () => {
        console.error(
          '[BackgroundSync] Failed to remove operation:',
          request.error,
        );
        reject(request.error);
      };
    });
  }

  /**
   * 增加重试次数
   */
  async incrementRetry(id: string): Promise<number> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (operation) {
          operation.retries += 1;
          const updateRequest = store.put(operation);

          updateRequest.onsuccess = () => {
            resolve(operation.retries);
          };

          updateRequest.onerror = () => {
            reject(updateRequest.error);
          };
        } else {
          reject(new Error('Operation not found'));
        }
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }

  /**
   * 清除所有待同步操作
   */
  async clearAll(): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('[BackgroundSync] All operations cleared');
        resolve();
      };

      request.onerror = () => {
        console.error(
          '[BackgroundSync] Failed to clear operations:',
          request.error,
        );
        reject(request.error);
      };
    });
  }

  /**
   * 获取待同步操作数量
   */
  async getPendingCount(): Promise<number> {
    const operations = await this.getPendingOperations();
    return operations.length;
  }
}

// 导出单例
export const backgroundSyncService = new BackgroundSyncService();
