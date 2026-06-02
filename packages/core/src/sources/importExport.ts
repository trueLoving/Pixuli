import type { StorageProviderConfig } from '../plugins/types';
import { pickRepoConfig } from './importExportHelpers';

export const PLUGIN_CONFIG_EXPORT_VERSION = '2.0';

export interface PluginConfigExportPayload {
  version: string;
  pluginId: string;
  platform?: string;
  timestamp: string;
  config: StorageProviderConfig;
}

export function buildPluginConfigExport(params: {
  pluginId: string;
  config: StorageProviderConfig;
  platform?: string;
}): PluginConfigExportPayload {
  return {
    version: PLUGIN_CONFIG_EXPORT_VERSION,
    pluginId: params.pluginId,
    platform: params.platform,
    timestamp: new Date().toISOString(),
    config: { ...params.config },
  };
}

export type ParsedPluginConfigImport = {
  pluginId: string;
  config: StorageProviderConfig;
};

/**
 * 解析单条仓库配置的导入 JSON（v2 含 pluginId；v1 仅 config，用 defaultPluginId 推断）。
 */
export function parsePluginConfigImport(
  data: unknown,
  defaultPluginId: string,
): ParsedPluginConfigImport | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  const record = data as Record<string, unknown>;

  let pluginId =
    typeof record.pluginId === 'string' && record.pluginId.length > 0
      ? record.pluginId
      : defaultPluginId;

  let configRaw: unknown = record.config;
  if (!configRaw && pickRepoConfig(record)) {
    configRaw = record;
  }
  if (!configRaw || typeof configRaw !== 'object') {
    return null;
  }

  const config = pickRepoConfig(configRaw as Record<string, unknown>);
  if (!config) {
    return null;
  }

  if (record.type === 'github' || record.type === 'gitee') {
    pluginId = record.type;
  }

  return { pluginId, config };
}
