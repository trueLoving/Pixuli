import type { LegacyStorageType } from '@pixuli/core/sources';

/** 侧栏源列表项（`useSourceManagement` → `AppSidebar` / `Sidebar`） */
export type SidebarSourceItem = {
  id: string;
  name: string;
  type: LegacyStorageType;
  owner: string;
  repo: string;
  path: string;
  active: boolean;
  available: boolean;
};
