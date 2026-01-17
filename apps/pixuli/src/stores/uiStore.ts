/**
 * 应用级别 UI 状态管理 Store
 * 管理全局 UI 状态，如模态框、侧边栏、全屏模式等
 */

import { create } from 'zustand';
import type { BrowseMode } from '@packages/common/src';

interface UIState {
  // 模态框状态
  showConfigModal: boolean;
  showSourceTypeMenu: boolean;
  showKeyboardHelp: boolean;
  showVersionInfo: boolean;

  // 编辑状态
  editingSourceId: string | null;

  // 侧边栏状态
  sidebarCollapsed: boolean;
  activeMenu: string; // 当前激活的菜单项

  // 浏览模式（应用级别，用于路由同步）
  browseMode: BrowseMode;

  // 全屏模式（应用级别，用于隐藏 Sidebar 和 Header）
  isFullscreenMode: boolean;

  // 视图状态（可能被多个页面使用）
  currentView: string; // 使用 string 以兼容 SidebarView 类型
  currentUtilityTool:
    | 'compress'
    | 'convert'
    | 'analyze'
    | 'edit'
    | 'generate'
    | null;

  // Actions - 模态框
  setShowConfigModal: (show: boolean) => void;
  setShowSourceTypeMenu: (show: boolean) => void;
  setShowKeyboardHelp: (show: boolean) => void;
  setShowVersionInfo: (show: boolean) => void;

  // Actions - 编辑
  setEditingSourceId: (id: string | null) => void;

  // Actions - 侧边栏
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setActiveMenu: (menu: string) => void;

  // Actions - 浏览模式
  setBrowseMode: (mode: BrowseMode) => void;

  // Actions - 全屏模式
  setIsFullscreenMode: (isFullscreen: boolean) => void;

  // Actions - 视图
  setCurrentView: (view: string) => void;
  setCurrentUtilityTool: (
    tool: 'compress' | 'convert' | 'analyze' | 'edit' | 'generate' | null,
  ) => void;

  // Helper actions
  openConfigModal: () => void;
  closeConfigModal: () => void;
  openKeyboardHelp: () => void;
  closeKeyboardHelp: () => void;
  openVersionInfo: () => void;
  closeVersionInfo: () => void;
  addSource: () => void;
  closeSourceTypeMenu: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // 初始状态
  showConfigModal: false,
  showSourceTypeMenu: false,
  showKeyboardHelp: false,
  showVersionInfo: false,
  editingSourceId: null,
  sidebarCollapsed: false,
  activeMenu: 'photos',
  browseMode: 'file',
  isFullscreenMode: false,
  currentView: 'photos',
  currentUtilityTool: null,

  // 模态框 Actions
  setShowConfigModal: (show: boolean) => set({ showConfigModal: show }),
  setShowSourceTypeMenu: (show: boolean) => set({ showSourceTypeMenu: show }),
  setShowKeyboardHelp: (show: boolean) => set({ showKeyboardHelp: show }),
  setShowVersionInfo: (show: boolean) => set({ showVersionInfo: show }),

  // 编辑 Actions
  setEditingSourceId: (id: string | null) => set({ editingSourceId: id }),

  // 侧边栏 Actions
  setSidebarCollapsed: (collapsed: boolean) =>
    set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () =>
    set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setActiveMenu: (menu: string) => set({ activeMenu: menu }),

  // 浏览模式 Actions
  setBrowseMode: (mode: BrowseMode) => set({ browseMode: mode }),

  // 全屏模式 Actions
  setIsFullscreenMode: (isFullscreen: boolean) =>
    set({ isFullscreenMode: isFullscreen }),

  // 视图 Actions
  setCurrentView: (view: string) => set({ currentView: view }),
  setCurrentUtilityTool: (
    tool: 'compress' | 'convert' | 'analyze' | 'edit' | 'generate' | null,
  ) => set({ currentUtilityTool: tool }),

  // Helper actions
  openConfigModal: () => set({ showConfigModal: true }),
  closeConfigModal: () =>
    set({ showConfigModal: false, editingSourceId: null }),
  openKeyboardHelp: () => set({ showKeyboardHelp: true }),
  closeKeyboardHelp: () => set({ showKeyboardHelp: false }),
  openVersionInfo: () => set({ showVersionInfo: true }),
  closeVersionInfo: () => set({ showVersionInfo: false }),
  addSource: () => set({ showSourceTypeMenu: true }),
  closeSourceTypeMenu: () => set({ showSourceTypeMenu: false }),
}));
