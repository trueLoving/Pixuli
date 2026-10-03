import { create } from 'zustand';

const STORAGE_KEY = 'pixuli.utilityTools.enabled';

function readEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // 私密模式等写失败时仍更新内存态
  }
}

interface UtilityToolsState {
  /** 设置中的图片工具总开关（压缩 / 转换）；默认关 */
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const useUtilityToolsStore = create<UtilityToolsState>(set => ({
  enabled: typeof localStorage === 'undefined' ? false : readEnabled(),
  setEnabled: enabled => {
    writeEnabled(enabled);
    set({ enabled });
  },
}));

/** 非 React 路径读取当前开关 */
export function isUtilityToolsEnabled(): boolean {
  return useUtilityToolsStore.getState().enabled;
}
