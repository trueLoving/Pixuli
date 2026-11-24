/** 侧栏源列表项（`useSourceManagement` → `AppSidebar` / `Sidebar`） */
export type SidebarSourceItem = {
  id: string;
  name: string;
  /** storage pluginId */
  type: string;
  owner: string;
  repo: string;
  path: string;
  active: boolean;
  available: boolean;
};

/** 与 `SidebarSourceItem` 同型；layouts 侧栏 props 沿用此别名 */
export type SidebarSource = SidebarSourceItem;
