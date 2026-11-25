import type { StorageProviderConfig } from '../plugins/types';

/** 预览 / 缩略图匹配输入（与 app uiRegistry 对齐；kind 为字符串以免 core 依赖 AssetKind） */
export type PluginUiMatchInput = {
  name: string;
  mimeType?: string;
  kind?: string;
};

/** Kind UI 可用的宿主工作区能力 */
export type PluginKindCapabilities = {
  readFile?: (path: string) => Promise<Uint8Array>;
  isLocalAvailable?: () => boolean;
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
  registerConnectionFields(contribution: {
    pluginId: string;
    labelPrefix?: string;
    isConfigComplete?: (config: StorageProviderConfig) => boolean;
    component: unknown;
  }): void;
  registerSourceIcon(contribution: { pluginId: string; render: unknown }): void;
  unregisterPreview(id: string): boolean;
  unregisterThumbnail(id: string): boolean;
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
    registerConnectionFields() {},
    registerSourceIcon() {},
    unregisterPreview() {
      return false;
    },
    unregisterThumbnail() {
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
