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
    /**
     * 是否贡献 kind.editor：原地改内容（如 Markdown / txt），
     * 写回原文件，不产生旁路新文件。
     */
    edit?: boolean;
    /**
     * 是否贡献 kind.process：对文件本体做变换（裁剪/压缩/转换等），
     * 产物为新文件（旁路写回），不覆盖原件。
     */
    process?: boolean;
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
  /** 移除已注册插件；不存在时返回 false */
  unregister(id: string): boolean;
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
