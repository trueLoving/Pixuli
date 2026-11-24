import type { KindPluginRegistry } from '../kinds/types';
import type { StoragePluginRegistry } from '../plugins/types';

export type PluginOrigin = 'builtin';

export type PluginCapabilityKind = 'storage' | 'kind';

/** 统一运行时清单（与 Storage/Kind 具体 manifest 正交） */
export interface RuntimePluginManifest {
  id: string;
  name: string;
  version: string;
  origin: PluginOrigin;
  capabilities: PluginCapabilityKind[];
  minAppVersion?: string;
}

/** 宿主注入的窄 API；本切片仅暴露能力 registry */
export interface PluginApi {
  storage: StoragePluginRegistry;
  kinds: KindPluginRegistry;
}

export interface RuntimePlugin {
  readonly manifest: RuntimePluginManifest;
  onload(api: PluginApi): void | Promise<void>;
  onunload?(): void | Promise<void>;
}

export type RuntimePluginFactory = () => RuntimePlugin;

export interface PluginStateRecord {
  id: string;
  enabled: boolean;
  origin: PluginOrigin;
  version: string;
}

export interface PluginLoadResult {
  id: string;
  ok: boolean;
  error?: string;
}

export interface PluginStateStore {
  get(id: string): PluginStateRecord | undefined;
  list(): PluginStateRecord[];
  set(record: PluginStateRecord): void | Promise<void>;
}

export interface PluginRuntime {
  registerBuiltin(factory: RuntimePluginFactory): void;
  /** 异步启动（支持 onload 返回 Promise） */
  start(): Promise<PluginLoadResult[]>;
  /**
   * 同步启动：onload 若返回 thenable 则记为失败。
   * 供 app 模块初始化与测试在同一 tick 内读到 registry。
   */
  startSync(): PluginLoadResult[];
  load(id: string): Promise<PluginLoadResult>;
  unload(id: string): Promise<void>;
  setEnabled(id: string, enabled: boolean): Promise<void>;
  listStates(): PluginStateRecord[];
  getLoadedIds(): string[];
}
