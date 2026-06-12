/** 工作区内约定路径（相对 workspace 根） */
export const WORKSPACE_PATHS = {
  config: '.pixuli/config.json',
  index: '.pixuli/index.json',
  syncState: '.pixuli/sync/state.json',
  syncQueue: '.pixuli/sync/queue.jsonl',
  syncConflicts: '.pixuli/sync/conflicts.json',
  trashDir: '.pixuli/trash',
  imagesDir: 'images',
} as const;

export const WORKSPACE_SCHEMA_VERSION = 1;
