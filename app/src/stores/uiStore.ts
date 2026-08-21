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
import type { ConnectionPurpose } from '@/features/source-type/connectionPurpose';
import type { SettingsSection } from '@/features/settings/settingsTypes';
import {
  EXPLORER_WIDTH_DEFAULT,
  EXPLORER_WIDTH_MAX,
  EXPLORER_WIDTH_MIN,
  INSPECTOR_WIDTH_DEFAULT,
  INSPECTOR_WIDTH_MAX,
  INSPECTOR_WIDTH_MIN,
  clampPanelWidth,
} from '../constants/panelWidth';
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
  showSettingsModal: boolean;
  /** 同步方向选择（远端→本地 / 本地→远端） */
  showSyncDirectionModal: boolean;
  showWorkspaceModal: boolean;
  /** 访问面板当前针对的资源；空则只改通道策略提示 */
  accessTargetImageId: string | null;
  /** 多选发布时带入的资源 id */
  accessTargetImageIds: string[];
  /** 设置弹窗左侧默认选中的分区 */
  settingsSection: SettingsSection;
  /** 打开设置弹窗后自动展开内联「添加远端」选择器 */
  settingsSyncAddOpen: boolean;
  /** 新建连接时暂存向导用途 */
  pendingConnectionPurpose: ConnectionPurpose | null;

  // 编辑状态（REF-312：编辑弹窗表单数据以 sourceStore 快照为准）
  editingSourceId: string | null;
  editingSourcePluginId: string | null;
  editingSourceRepoConfig: EditingSourceRepoConfig | null;

  // 侧边栏状态
  sidebarCollapsed: boolean;
  /** 窄屏抽屉式侧边栏是否展开 */
  mobileSidebarOpen: boolean;
  activeMenu: string;

  // 全屏模式（应用级别，用于隐藏 Sidebar）
  isFullscreenMode: boolean;

  // 视图状态
  currentView: string;
  currentUtilityTool: 'compress' | 'convert' | null;
  /** 工作区资源管理器当前选中的文件夹（空 = 全部） */
  selectedFolderPath: string;
  /** 窄屏是否展开文件夹面板 */
  workspaceExplorerOpen: boolean;
  /** 宽屏资源浏览器宽度（px） */
  workspaceExplorerWidth: number;
  /** 宽屏 Inspector 宽度（px） */
  inspectorWidth: number;
  /** 宽屏/中屏 dock Inspector 是否折叠 */
  inspectorCollapsed: boolean;

  // Actions - 模态框
  setShowConfigModal: (show: boolean) => void;
  setShowSettingsModal: (show: boolean) => void;

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
  setSelectedFolderPath: (path: string) => void;
  setWorkspaceExplorerOpen: (open: boolean) => void;
  toggleWorkspaceExplorer: () => void;
  setWorkspaceExplorerWidth: (width: number) => void;
  setInspectorWidth: (width: number) => void;
  setInspectorCollapsed: (collapsed: boolean) => void;

  // Actions - 模态框
  setShowWorkspaceModal: (show: boolean) => void;

  // Helper actions
  /** 右键/菜单编辑：从 sourceStore 读取 config 并打开对应类型弹窗 */
  openConfigModalForEdit: (sourceId: string) => boolean;
  openConfigModal: () => void;
  closeConfigModal: () => void;
  openKeyboardHelp: () => void;
  openVersionInfo: () => void;
  openOperationLog: () => void;
  openSettingsModal: (section?: SettingsSection) => void;
  closeSettingsModal: () => void;
  openSyncDirectionModal: () => void;
  closeSyncDirectionModal: () => void;
  /** 无远端配置则打开设置「同步」；已配置则选择同步方向 */
  requestSync: () => void;
  openWorkspaceModal: () => void;
  closeWorkspaceModal: () => void;
  openAccessModal: (imageId?: string, imageIds?: string[]) => void;
  openSettingsModalForAddSource: () => void;
  clearSettingsSyncAddOpen: () => void;
  beginNewSource: (pluginId: string, purpose?: ConnectionPurpose) => void;
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
  showSettingsModal: false,
  showSyncDirectionModal: false,
  settingsSection: 'workspace',
  settingsSyncAddOpen: false,
  pendingConnectionPurpose: null,
  editingSourceId: null,
  editingSourcePluginId: null,
  editingSourceRepoConfig: null,
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  activeMenu: 'photos',
  isFullscreenMode: false,
  currentView: 'photos',
  currentUtilityTool: null,
  selectedFolderPath: '',
  workspaceExplorerOpen: false,
  workspaceExplorerWidth: EXPLORER_WIDTH_DEFAULT,
  inspectorWidth: INSPECTOR_WIDTH_DEFAULT,
  inspectorCollapsed: false,
  showWorkspaceModal: false,
  accessTargetImageId: null,
  accessTargetImageIds: [],

  setShowConfigModal: (show: boolean) => set({ showConfigModal: show }),
  setShowSettingsModal: (show: boolean) => set({ showSettingsModal: show }),
  setShowWorkspaceModal: (show: boolean) => set({ showWorkspaceModal: show }),

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
  setSelectedFolderPath: (path: string) => set({ selectedFolderPath: path }),
  setWorkspaceExplorerOpen: (open: boolean) =>
    set({ workspaceExplorerOpen: open }),
  toggleWorkspaceExplorer: () =>
    set(state => ({ workspaceExplorerOpen: !state.workspaceExplorerOpen })),
  setWorkspaceExplorerWidth: (width: number) =>
    set({
      workspaceExplorerWidth: clampPanelWidth(
        width,
        EXPLORER_WIDTH_MIN,
        EXPLORER_WIDTH_MAX,
      ),
    }),
  setInspectorWidth: (width: number) =>
    set({
      inspectorWidth: clampPanelWidth(
        width,
        INSPECTOR_WIDTH_MIN,
        INSPECTOR_WIDTH_MAX,
      ),
    }),
  setInspectorCollapsed: (collapsed: boolean) =>
    set({ inspectorCollapsed: collapsed }),

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
  openKeyboardHelp: () =>
    set({
      showSettingsModal: true,
      settingsSection: 'keyboard',
      settingsSyncAddOpen: false,
      activeMenu: 'settings',
    }),
  openVersionInfo: () =>
    set({
      showSettingsModal: true,
      settingsSection: 'version',
      settingsSyncAddOpen: false,
      activeMenu: 'settings',
    }),
  openOperationLog: () =>
    set({
      showSettingsModal: true,
      settingsSection: 'operationLog',
      settingsSyncAddOpen: false,
      activeMenu: 'settings',
    }),
  openSettingsModal: (section = 'workspace') =>
    set({
      showSettingsModal: true,
      settingsSection: section,
      settingsSyncAddOpen: false,
      activeMenu: 'settings',
    }),
  closeSettingsModal: () =>
    set({
      showSettingsModal: false,
      settingsSyncAddOpen: false,
      accessTargetImageId: null,
      accessTargetImageIds: [],
    }),
  openSyncDirectionModal: () => set({ showSyncDirectionModal: true }),
  closeSyncDirectionModal: () => set({ showSyncDirectionModal: false }),
  requestSync: () => {
    const { sources } = useSourceStore.getState();
    if (sources.length === 0) {
      set({
        showSettingsModal: true,
        settingsSection: 'sync',
        settingsSyncAddOpen: true,
        activeMenu: 'settings',
      });
      return;
    }
    set({ showSyncDirectionModal: true });
  },
  openWorkspaceModal: () => set({ showWorkspaceModal: true }),
  closeWorkspaceModal: () => set({ showWorkspaceModal: false }),
  openAccessModal: (imageId?: string, imageIds?: string[]) =>
    set({
      showSettingsModal: true,
      settingsSection: 'access',
      accessTargetImageId: imageId ?? imageIds?.[0] ?? null,
      accessTargetImageIds: imageIds?.length
        ? imageIds
        : imageId
          ? [imageId]
          : [],
      activeMenu: 'settings',
    }),
  openSettingsModalForAddSource: () =>
    set({
      showSettingsModal: true,
      settingsSection: 'sync',
      settingsSyncAddOpen: true,
      activeMenu: 'settings',
    }),
  clearSettingsSyncAddOpen: () => set({ settingsSyncAddOpen: false }),
  beginNewSource: (pluginId: string, purpose?: ConnectionPurpose) => {
    useImageStore.setState({
      storageType: pluginId as 'github' | 'gitee',
    });
    set({
      editingSourceId: null,
      editingSourcePluginId: null,
      editingSourceRepoConfig: null,
      showConfigModal: true,
      pendingConnectionPurpose: purpose ?? 'defaultSync',
    });
  },
}));
