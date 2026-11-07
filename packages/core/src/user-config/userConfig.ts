import {
  SETTINGS_EXPORT_KIND,
  SETTINGS_EXPORT_VERSION,
  parsePluginConfigImport,
} from '../sources/importExport';
import {
  createStoredSourceEntry,
  normalizeStoredSources,
} from '../sources/normalize';
import type { StoredSourceEntry } from '../plugins/types';
import {
  USER_CONFIG_KIND,
  USER_CONFIG_SCHEMA_VERSION,
  type BuildUserConfigParams,
  type ParsedUserConfig,
  type UserConfigPayload,
  type UserConfigPreferencesBlock,
  type UserConfigTheme,
} from './types';

const KNOWN_BLOCKS = new Set(['preferences', 'sources']);

function selectedIdFrom(
  sources: StoredSourceEntry[],
  raw: unknown,
): string | null {
  if (typeof raw === 'string' && sources.some(source => source.id === raw)) {
    return raw;
  }
  return sources[0]?.id ?? null;
}

function isTheme(value: unknown): value is UserConfigTheme {
  return value === 'system' || value === 'light' || value === 'dark';
}

function parsePreferencesBlock(
  raw: unknown,
): UserConfigPreferencesBlock | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const out: UserConfigPreferencesBlock = {};
  if (typeof record.language === 'string' && record.language.trim()) {
    out.language = record.language.trim();
  }
  if (isTheme(record.theme)) {
    out.theme = record.theme;
  }
  return Object.keys(out).length > 0 ? out : null;
}

function parseSourcesBlock(raw: unknown): ParsedUserConfig['sources'] {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const list = Array.isArray(record.items)
    ? record.items
    : Array.isArray(record.sources)
      ? record.sources
      : null;
  if (!list) return null;
  const items = normalizeStoredSources(list);
  if (list.length > 0 && items.length === 0) {
    return null;
  }
  return {
    items,
    selectedSourceId: selectedIdFrom(items, record.selectedSourceId),
  };
}

function legacySettingsToParsed(
  data: Record<string, unknown>,
): ParsedUserConfig | null {
  if (
    !(
      Array.isArray(data.sources) &&
      (data.kind === SETTINGS_EXPORT_KIND ||
        data.version === SETTINGS_EXPORT_VERSION)
    )
  ) {
    return null;
  }
  const items = normalizeStoredSources(data.sources);
  if (data.sources.length > 0 && items.length === 0) {
    return null;
  }
  return {
    schemaVersion: 1,
    preferences: null,
    sources: {
      items,
      selectedSourceId: selectedIdFrom(items, data.selectedSourceId),
    },
    skippedBlocks: [],
  };
}

function legacyPluginToParsed(data: unknown): ParsedUserConfig | null {
  const single = parsePluginConfigImport(data, 'github');
  if (!single) return null;
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
  return {
    schemaVersion: 1,
    preferences: null,
    sources: { items: [entry], selectedSourceId: entry.id },
    skippedBlocks: [],
  };
}

/**
 * 将旧版 `pixuli-settings` / 单插件导出迁到 user-config 语义（仅内存解析）。
 */
export function migrateToUserConfig(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  const record = data as Record<string, unknown>;
  if (record.kind === USER_CONFIG_KIND) return data;

  const fromSettings = legacySettingsToParsed(record);
  if (fromSettings?.sources) {
    return buildUserConfigExport({
      sources: {
        items: fromSettings.sources.items,
        selectedSourceId: fromSettings.sources.selectedSourceId,
      },
    });
  }

  const fromPlugin = legacyPluginToParsed(data);
  if (fromPlugin?.sources) {
    return buildUserConfigExport({
      sources: {
        items: fromPlugin.sources.items,
        selectedSourceId: fromPlugin.sources.selectedSourceId,
      },
    });
  }

  return data;
}

export function buildUserConfigExport(
  params: BuildUserConfigParams,
): UserConfigPayload {
  const blocks: UserConfigPayload['blocks'] = {};
  if (params.preferences) {
    blocks.preferences = { ...params.preferences };
  }
  if (params.sources) {
    blocks.sources = {
      selectedSourceId: params.sources.selectedSourceId,
      items: params.sources.items.map(source => ({
        ...source,
        config: { ...source.config },
      })),
    };
  }
  return {
    kind: USER_CONFIG_KIND,
    schemaVersion: USER_CONFIG_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    blocks,
  };
}

/**
 * 解析个人配置信封。兼容旧 `pixuli-settings` 与单插件导出。
 * 未知块名记入 skippedBlocks，不导致整文件失败。
 */
export function parseUserConfigImport(data: unknown): ParsedUserConfig | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;

  if (record.kind !== USER_CONFIG_KIND) {
    return legacySettingsToParsed(record) ?? legacyPluginToParsed(data) ?? null;
  }

  const schemaVersion =
    typeof record.schemaVersion === 'number' &&
    Number.isFinite(record.schemaVersion)
      ? record.schemaVersion
      : USER_CONFIG_SCHEMA_VERSION;

  const blocksRaw =
    record.blocks && typeof record.blocks === 'object'
      ? (record.blocks as Record<string, unknown>)
      : {};

  const skippedBlocks = Object.keys(blocksRaw).filter(
    key => !KNOWN_BLOCKS.has(key),
  );

  const preferences = parsePreferencesBlock(blocksRaw.preferences);
  const sources = parseSourcesBlock(blocksRaw.sources);

  if (
    blocksRaw.sources !== undefined &&
    sources === null &&
    typeof blocksRaw.sources === 'object' &&
    blocksRaw.sources !== null &&
    Array.isArray((blocksRaw.sources as { items?: unknown }).items) &&
    ((blocksRaw.sources as { items: unknown[] }).items.length ?? 0) > 0
  ) {
    return null;
  }

  if (!preferences && !sources && Object.keys(blocksRaw).length === 0) {
    return {
      schemaVersion,
      preferences: null,
      sources: { items: [], selectedSourceId: null },
      skippedBlocks: [],
    };
  }

  if (!preferences && !sources && skippedBlocks.length === 0) {
    return null;
  }

  return {
    schemaVersion,
    preferences,
    sources,
    skippedBlocks,
  };
}

/** 兼容旧调用：只导出 sources 块（新信封）。 */
export function buildSettingsExport(params: {
  sources: StoredSourceEntry[];
  selectedSourceId: string | null;
}): UserConfigPayload {
  return buildUserConfigExport({
    sources: {
      items: params.sources,
      selectedSourceId: params.selectedSourceId,
    },
  });
}

export type ParsedSettingsImport = {
  sources: StoredSourceEntry[];
  selectedSourceId: string | null;
};

/** 兼容旧调用：从任意支持格式中取出 sources。 */
export function parseSettingsImport(
  data: unknown,
): ParsedSettingsImport | null {
  const parsed = parseUserConfigImport(data);
  if (!parsed?.sources) return null;
  return {
    sources: parsed.sources.items,
    selectedSourceId: parsed.sources.selectedSourceId,
  };
}
