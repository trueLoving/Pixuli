import { createKindPluginRegistry } from '@pixuli/core/kinds';
import { createStoragePluginRegistry } from '@pixuli/core/plugins';

/** 能力 registry 单例（与 Runtime / UI 贡献分离，避免循环依赖） */
export const storageRegistry = createStoragePluginRegistry();
export const kindRegistry = createKindPluginRegistry();
