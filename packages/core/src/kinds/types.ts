import type { AssetKind } from '../types';

/** Kind 插件清单（文件类型处理；与 StorageProvider 正交） */
export interface KindPluginManifest {
  id: string;
  name: string;
  version: string;
  kind: AssetKind;
  capabilities: {
    preview: boolean;
    thumbnail: boolean;
    /** 声明式动作 id；执行由 handler / app 后续扩展 */
    actions: string[];
  };
}

export interface KindMatchInput {
  name: string;
  mimeType?: string;
}

/**
 * KindHandler — 识别与能力声明；预览 UI / 处理面板由插件包另导出（如 `/ui`）。
 * core 不含 React。
 */
export interface KindHandler {
  readonly manifest: KindPluginManifest;
  match(input: KindMatchInput): boolean;
}

export type KindHandlerFactory = () => KindHandler;

export interface KindPluginRegistry {
  register(manifest: KindPluginManifest, factory: KindHandlerFactory): void;
  get(id: string): KindHandler | undefined;
  getManifest(id: string): KindPluginManifest | undefined;
  listManifests(): KindPluginManifest[];
  /** 按注册顺序返回首个 match 的 handler */
  matchHandler(input: KindMatchInput): KindHandler | undefined;
}

export class KindPluginAlreadyRegisteredError extends Error {
  constructor(public readonly pluginId: string) {
    super(`Kind plugin already registered: ${pluginId}`);
    this.name = 'KindPluginAlreadyRegisteredError';
  }
}
