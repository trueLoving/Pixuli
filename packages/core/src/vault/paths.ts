/** 工作区内约定路径（相对 workspace 根） */
export const WORKSPACE_PATHS = {
  config: '.pixuli/config.json',
  index: '.pixuli/index.json',
  access: '.pixuli/access.json',
  syncState: '.pixuli/sync/state.json',
  syncQueue: '.pixuli/sync/queue.jsonl',
  syncConflicts: '.pixuli/sync/conflicts.json',
  trashDir: '.pixuli/trash',
  imagesDir: 'images',
  /** 显式空文件夹列表（相对路径），用于树中显示无文件目录 */
  folders: '.pixuli/folders.json',
} as const;

export const WORKSPACE_SCHEMA_VERSION = 1;
