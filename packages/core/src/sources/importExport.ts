import type {
  StorageProviderConfig,
  StoredSourceEntry,
} from '../plugins/types';
import { pickRepoConfig } from './importExportHelpers';
import { createStoredSourceEntry, normalizeStoredSources } from './normalize';

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

export const SETTINGS_EXPORT_VERSION = '1.0';
export const SETTINGS_EXPORT_KIND = 'pixuli-settings';

export interface SettingsExportPayload {
  version: typeof SETTINGS_EXPORT_VERSION;
  kind: typeof SETTINGS_EXPORT_KIND;
  timestamp: string;
  selectedSourceId: string | null;
  sources: StoredSourceEntry[];
}

export function buildSettingsExport(params: {
  sources: StoredSourceEntry[];
  selectedSourceId: string | null;
}): SettingsExportPayload {
  return {
    version: SETTINGS_EXPORT_VERSION,
    kind: SETTINGS_EXPORT_KIND,
    timestamp: new Date().toISOString(),
    selectedSourceId: params.selectedSourceId,
    sources: params.sources.map(source => ({
      ...source,
      config: { ...source.config },
    })),
  };
}

export type ParsedSettingsImport = {
  sources: StoredSourceEntry[];
  selectedSourceId: string | null;
};

function selectedIdFrom(
  sources: StoredSourceEntry[],
  raw: unknown,
): string | null {
  if (typeof raw === 'string' && sources.some(source => source.id === raw)) {
    return raw;
  }
  return sources[0]?.id ?? null;
}

/**
 * 解析设置页导出的远端仓库列表。也接受旧版单条仓库配置（v1/v2），并转成一条新源。
 */
export function parseSettingsImport(
  data: unknown,
): ParsedSettingsImport | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  const record = data as Record<string, unknown>;

  if (
    Array.isArray(record.sources) &&
    (record.kind === SETTINGS_EXPORT_KIND ||
      record.version === SETTINGS_EXPORT_VERSION)
  ) {
    const sources = normalizeStoredSources(record.sources);
    if (record.sources.length > 0 && sources.length === 0) {
      return null;
    }
    return {
      sources,
      selectedSourceId: selectedIdFrom(sources, record.selectedSourceId),
    };
  }

  const single = parsePluginConfigImport(data, 'github');
  if (!single) {
    return null;
  }
  const owner = single.config.owner;
  const repo = single.config.repo;
  const label =
    typeof owner === 'string' && typeof repo === 'string'
      ? `${owner}/${repo}`
      : single.pluginId;
  const entry = createStoredSourceEntry({
    pluginId: single.pluginId,
    label,
    config: single.config,
  });
  return { sources: [entry], selectedSourceId: entry.id };
}
