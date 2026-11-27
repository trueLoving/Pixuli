import type { AssetKind } from '../types';

/**
 * 插件声明的**逻辑**采集来源（不是 Capacitor/Electron API）。
 * App 用「平台实际能力 ∩ 各 Kind 声明」决定展示哪些入口：
 * - `file`：系统文件选择 / 拖放（Web · Desktop · Mobile 通常都有）
 * - `gallery`：系统相册 / 媒体库（多为 Mobile）
 * - `camera`：相机拍照（多为 Mobile）
 */
export type KindIngestSource = 'file' | 'gallery' | 'camera';

/**
 * Kind 入库 accept：驱动 upload 文件选择；无 `ingest` 则不可经上传入口选入。
 * 处理（裁剪/压缩等）走 `kind.process`，不在上传流内。
 */
export interface KindIngestSpec {
  /** react-dropzone / `<input accept>`：mime → 扩展名（含点，如 `.jpg`） */
  accept: Record<string, string[]>;
  /**
   * 本 Kind 声明支持的采集来源（必填语义：缺省视为仅 `file`）。
   * 平台能否提供由 App 适配器决定，插件不要写 `if (mobile)`。
   */
  preferredSources?: KindIngestSource[];
}

/** Kind 插件清单（文件类型处理；与 StorageProvider 正交） */
export interface KindPluginManifest {
  id: string;
  name: string;
  version: string;
  kind: AssetKind;
  /** 入库类型与入口偏好；缺省表示不参与 upload accept */
  ingest?: KindIngestSpec;
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
