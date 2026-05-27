/**
 * 应用级别 UI 状态管理 Store
 * 管理全局 UI 状态，如模态框、侧边栏、全屏模式等
 */

import { create } from 'zustand';

interface UIState {
  // 模态框状态
  showConfigModal: boolean;
  showSourceTypeMenu: boolean;
  showKeyboardHelp: boolean;
  showVersionInfo: boolean;
  showOperationLog: boolean;

  // 编辑状态
  editingSourceId: string | null;

  // 侧边栏状态
  sidebarCollapsed: boolean;
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
  setActiveMenu: (menu: string) => void;

  // Actions - 全屏模式
  setIsFullscreenMode: (isFullscreen: boolean) => void;

  // Actions - 视图
  setCurrentView: (view: string) => void;
  setCurrentUtilityTool: (tool: 'compress' | 'convert' | null) => void;

  // Helper actions
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

export const useUIStore = create<UIState>(set => ({
  showConfigModal: false,
  showSourceTypeMenu: false,
  showKeyboardHelp: false,
  showVersionInfo: false,
  showOperationLog: false,
  editingSourceId: null,
  sidebarCollapsed: false,
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
  setActiveMenu: (menu: string) => set({ activeMenu: menu }),

  setIsFullscreenMode: (isFullscreen: boolean) =>
    set({ isFullscreenMode: isFullscreen }),

  setCurrentView: (view: string) => set({ currentView: view }),
  setCurrentUtilityTool: (tool: 'compress' | 'convert' | null) =>
    set({ currentUtilityTool: tool }),

  openConfigModal: () => set({ showConfigModal: true }),
  closeConfigModal: () =>
    set({ showConfigModal: false, editingSourceId: null }),
  openKeyboardHelp: () => set({ showKeyboardHelp: true }),
  closeKeyboardHelp: () => set({ showKeyboardHelp: false }),
  openVersionInfo: () => set({ showVersionInfo: true }),
  closeVersionInfo: () => set({ showVersionInfo: false }),
  openOperationLog: () => set({ showOperationLog: true }),
  closeOperationLog: () => set({ showOperationLog: false }),
  addSource: () => set({ showSourceTypeMenu: true }),
  closeSourceTypeMenu: () => set({ showSourceTypeMenu: false }),
}));
