import type React from 'react';

export type SidebarView = 'library' | 'explore' | 'tags' | 'favorites';

export type SidebarFilter = 'all' | 'tags' | 'favorites';
export type SidebarUtilityTool = 'compress' | 'convert';

export type SidebarMenuItem =
  | { type: 'library' }
  | { type: 'workspace' }
  | { type: 'utility'; tool: SidebarUtilityTool };

export interface SidebarSource {
  id: string;
  name: string;
  type: 'github' | 'gitee';
  owner: string;
  repo: string;
  path: string;
  active?: boolean;
  available?: boolean;
}

export interface SidebarProps {
  onMenuClick?: (menuItem: SidebarMenuItem) => void;
  activeMenu?: string;
  sources: SidebarSource[];
  selectedSourceId: string | null;
  onSourceSelect: (id: string) => void;
  onSourceEdit?: (id: string) => void;
  onSourceDelete?: (id: string) => void;
  onSourceOpenInWindow?: (id: string) => void;
  hasConfig: boolean;
  onAddSource: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  footerExtra?: React.ReactNode;
  hideSources?: boolean;
  onSettingsClick?: () => void;
  onSyncClick?: () => void;
  syncBusy?: boolean;
  syncDisabled?: boolean;
  syncDisabledTitle?: string;
  syncStrategyLabel?: string;
  syncRemoteLabel?: string;
  hideUtilityTools?: boolean;
  hideHelpFooter?: boolean;
  showWorkspaceNav?: boolean;
  t?: (key: string) => string;
}

export interface SidebarNavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  comingSoon?: boolean;
  onClick?: () => void;
  tooltip?: string;
  t?: (key: string) => string;
}

export type SidebarPrimaryNavItem = {
  menuKey: string;
  icon: React.ReactNode;
  label: string;
  menuItem: SidebarMenuItem;
  requiresConfig?: boolean;
};
