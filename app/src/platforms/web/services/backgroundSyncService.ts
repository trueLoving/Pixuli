/**
 * 后台同步服务：离线期间的操作在恢复网络后同步。
 * 当前为占位实现，返回 0 待同步；后续可接入 IndexedDB + Background Sync API。
 */
let initialized = false;

export const backgroundSyncService = {
  async init(): Promise<void> {
    if (initialized) return;
    initialized = true;
  },

  async getPendingCount(): Promise<number> {
    await this.init();
    return 0;
  },
};
