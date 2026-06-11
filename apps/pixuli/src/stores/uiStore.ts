/**
 * 应用级别 UI 状态管理 Store
 * 管理全局 UI 状态，如模态框、侧边栏、全屏模式等
 */

import {
  getRepoConfigFromSource,
  pluginIdToLegacyType,
} from '@pixuli/core/sources';
import type { GiteeConfig, GitHubConfig } from '@pixuli/core/types';
import { create } from 'zustand';
import { isStoragePluginRegistered } from '../storage/registry';
import { useImageStore } from './imageStore';
import { useSourceStore } from './sourceStore';

export type EditingSourceRepoConfig = Pick<
  GitHubConfig,
  'owner' | 'repo' | 'branch' | 'token' | 'path'
>;

interface UIState {
  // 模态框状态
  showConfigModal: boolean;
  showSourceTypeMenu: boolean;
  showKeyboardHelp: boolean;
  showVersionInfo: boolean;
  showOperationLog: boolean;

  // 编辑状态（REF-312：编辑弹窗表单数据以 sourceStore 快照为准）
  editingSourceId: string | null;
  editingSourcePluginId: string | null;
  editingSourceRepoConfig: EditingSourceRepoConfig | null;

  // 侧边栏状态
  sidebarCollapsed: boolean;
  /** 窄屏抽屉式侧边栏是否展开 */
  mobileSidebarOpen: boolean;
  activeMenu: string;

  // 全屏模式（应用级别，用于隐藏 Sidebar 和 Header）
  isFullscreenMode: boolean;

  // 视图状态
  currentView: string;
  currentUtilityTool: 'compress' | 'convert' | null;

  // Actions - 模态框
  setShowConfigModal: (show: boolean) => void;
  setShowSourceTypeMenu: (show: boolean) => void;
  setShowKeyboardHelp: (show: boolean) => void;
  setShowVersionInfo: (show: boolean) => void;
  setShowOperationLog: (show: boolean) => void;

  // Actions - 编辑
  setEditingSourceId: (id: string | null) => void;

  // Actions - 侧边栏
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  setActiveMenu: (menu: string) => void;

  // Actions - 全屏模式
  setIsFullscreenMode: (isFullscreen: boolean) => void;

  // Actions - 视图
  setCurrentView: (view: string) => void;
  setCurrentUtilityTool: (tool: 'compress' | 'convert' | null) => void;

  // Helper actions
  /** 右键/菜单编辑：从 sourceStore 读取 config 并打开对应类型弹窗 */
  openConfigModalForEdit: (sourceId: string) => boolean;
  openConfigModal: () => void;
  closeConfigModal: () => void;
  openKeyboardHelp: () => void;
  closeKeyboardHelp: () => void;
  openVersionInfo: () => void;
  closeVersionInfo: () => void;
  openOperationLog: () => void;
  closeOperationLog: () => void;
  addSource: () => void;
  closeSourceTypeMenu: () => void;
}

function syncImageStoreForRepoConfig(
  pluginId: string,
  repoConfig: EditingSourceRepoConfig,
): void {
  const legacyType = pluginIdToLegacyType(pluginId);
  const { setGitHubConfig, setGiteeConfig } = useImageStore.getState();
  if (legacyType === 'github') {
    setGitHubConfig(repoConfig as GitHubConfig);
  } else {
    setGiteeConfig(repoConfig as GiteeConfig);
  }
}

export const useUIStore = create<UIState>(set => ({
  showConfigModal: false,
  showSourceTypeMenu: false,
  showKeyboardHelp: false,
  showVersionInfo: false,
  showOperationLog: false,
  editingSourceId: null,
  editingSourcePluginId: null,
  editingSourceRepoConfig: null,
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  activeMenu: 'photos',
  isFullscreenMode: false,
  currentView: 'photos',
  currentUtilityTool: null,

  setShowConfigModal: (show: boolean) => set({ showConfigModal: show }),
  setShowSourceTypeMenu: (show: boolean) => set({ showSourceTypeMenu: show }),
  setShowKeyboardHelp: (show: boolean) => set({ showKeyboardHelp: show }),
  setShowVersionInfo: (show: boolean) => set({ showVersionInfo: show }),
  setShowOperationLog: (show: boolean) => set({ showOperationLog: show }),

  setEditingSourceId: (id: string | null) => set({ editingSourceId: id }),

  setSidebarCollapsed: (collapsed: boolean) =>
    set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () =>
    set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setMobileSidebarOpen: (open: boolean) => set({ mobileSidebarOpen: open }),
  toggleMobileSidebar: () =>
    set(state => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
  setActiveMenu: (menu: string) => set({ activeMenu: menu }),

  setIsFullscreenMode: (isFullscreen: boolean) =>
    set({ isFullscreenMode: isFullscreen }),

  setCurrentView: (view: string) => set({ currentView: view }),
  setCurrentUtilityTool: (tool: 'compress' | 'convert' | null) =>
    set({ currentUtilityTool: tool }),

  openConfigModalForEdit: (sourceId: string) => {
    const source = useSourceStore.getState().getSourceById(sourceId);
    if (!source || !isStoragePluginRegistered(source.pluginId)) {
      return false;
    }
    const repoConfig = getRepoConfigFromSource(source);
    syncImageStoreForRepoConfig(source.pluginId, repoConfig);
    set({
      editingSourceId: sourceId,
      editingSourcePluginId: source.pluginId,
      editingSourceRepoConfig: repoConfig,
      showConfigModal: true,
    });
    return true;
  },

  openConfigModal: () =>
    set({
      showConfigModal: true,
      editingSourceId: null,
      editingSourcePluginId: null,
      editingSourceRepoConfig: null,
    }),
  closeConfigModal: () =>
    set({
      showConfigModal: false,
      editingSourceId: null,
      editingSourcePluginId: null,
      editingSourceRepoConfig: null,
    }),
  openKeyboardHelp: () => set({ showKeyboardHelp: true }),
  closeKeyboardHelp: () => set({ showKeyboardHelp: false }),
  openVersionInfo: () => set({ showVersionInfo: true }),
  closeVersionInfo: () => set({ showVersionInfo: false }),
  openOperationLog: () => set({ showOperationLog: true }),
  closeOperationLog: () => set({ showOperationLog: false }),
  addSource: () => set({ showSourceTypeMenu: true }),
  closeSourceTypeMenu: () => set({ showSourceTypeMenu: false }),
}));
