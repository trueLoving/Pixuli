import type { StorageProviderConfig } from '../plugins/types';

/** 预览 / 缩略图 / 编辑 / 处理匹配输入（kind 为字符串以免 core 依赖 AssetKind） */
export type PluginUiMatchInput = {
  name: string;
  mimeType?: string;
  kind?: string;
};

export type PluginUiPlacement = 'modal' | 'panel' | 'fullscreen';

/**
 * Kind UI 可用的宿主工作区能力。
 * - editor：`readFile` / `writeFile` 原地改原路径内容。
 * - process：`readAssetBytes` + `saveProcessedAsset` 产出旁路新文件。
 */
export type PluginKindCapabilities = {
  /** editor：读本机原文件 */
  readFile?: (path: string) => Promise<Uint8Array>;
  /** editor：原地写回原路径；不自动 push */
  writeFile?: (path: string, data: Uint8Array) => Promise<void>;
  isLocalAvailable?: () => boolean;
  /** process：按资源读字节（本机优先，否则 fetch url） */
  readAssetBytes?: (asset: {
    name: string;
    type?: string;
    url?: string;
    localPath?: string;
  }) => Promise<Uint8Array>;
  /** process：旁路写回新文件；仅本机，不入同步队列，不覆盖原件 */
  saveProcessedAsset?: (input: {
    source: {
      name: string;
      type?: string;
      url?: string;
      localPath?: string;
    };
    fileName: string;
    data: Uint8Array;
    mimeType: string;
    width?: number;
    height?: number;
  }) => Promise<{ path: string }>;
};

/**
 * 宿主 UI 贡献面。component / render 为 unknown，避免 core 依赖 React；
 * 官方插件 contribute* 与 app uiRegistry 负责具体类型。
 */
export interface PluginUiHost {
  registerPreview(contribution: {
    id: string;
    priority?: number;
    match: (input: PluginUiMatchInput) => boolean;
    component: unknown;
  }): void;
  registerThumbnail(contribution: {
    id: string;
    priority?: number;
    match: (input: PluginUiMatchInput) => boolean;
    capture: (url: string) => Promise<string | null>;
  }): void;
  registerEditor(contribution: {
    id: string;
    priority?: number;
    match: (input: PluginUiMatchInput) => boolean;
    component: unknown;
    placement?: PluginUiPlacement;
    labelKey?: string;
  }): void;
  registerProcess(contribution: {
    id: string;
    priority?: number;
    match: (input: PluginUiMatchInput) => boolean;
    component: unknown;
    placement?: PluginUiPlacement;
    labelKey?: string;
  }): void;
  registerConnectionFields(contribution: {
    pluginId: string;
    labelPrefix?: string;
    isConfigComplete?: (config: StorageProviderConfig) => boolean;
    component: unknown;
  }): void;
  registerSourceIcon(contribution: { pluginId: string; render: unknown }): void;
  unregisterPreview(id: string): boolean;
  unregisterThumbnail(id: string): boolean;
  unregisterEditor(id: string): boolean;
  unregisterProcess(id: string): boolean;
  unregisterConnectionFields(pluginId: string): boolean;
  unregisterSourceIcon(pluginId: string): boolean;
  getKindCapabilities(): PluginKindCapabilities;
}

/** 测试与无 UI 宿主用的空实现 */
export function createEmptyPluginUiHost(
  caps: PluginKindCapabilities = {},
): PluginUiHost {
  return {
    registerPreview() {},
    registerThumbnail() {},
    registerEditor() {},
    registerProcess() {},
    registerConnectionFields() {},
    registerSourceIcon() {},
    unregisterPreview() {
      return false;
    },
    unregisterThumbnail() {
      return false;
    },
    unregisterEditor() {
      return false;
    },
    unregisterProcess() {
      return false;
    },
    unregisterConnectionFields() {
      return false;
    },
    unregisterSourceIcon() {
      return false;
    },
    getKindCapabilities() {
      return caps;
    },
  };
}
