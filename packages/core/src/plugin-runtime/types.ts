import type { KindPluginRegistry } from '../kinds/types';
import type { StoragePluginRegistry } from '../plugins/types';
import type { PluginUiHost } from './uiHost';

export type PluginOrigin = 'builtin' | 'external';

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

/** 宿主注入的窄 API */
export interface PluginApi {
  storage: StoragePluginRegistry;
  kinds: KindPluginRegistry;
  ui: PluginUiHost;
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
  /** 卸载 external 时移除持久化状态；无记录时为 no-op */
  delete(id: string): void | Promise<void>;
}

export interface PluginRuntime {
  registerBuiltin(factory: RuntimePluginFactory): void;
  /** 第三方 / 磁盘加载插件；state.origin 固定为 external */
  registerExternal(factory: RuntimePluginFactory): void;
  /**
   * 卸载已注册的 external：先 onunload，再移除 factory / state。
   * builtin 不可调用。磁盘文件由宿主另行删除。
   */
  unregisterExternal(id: string): Promise<void>;
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
  getManifest(id: string): RuntimePluginManifest | undefined;
}
