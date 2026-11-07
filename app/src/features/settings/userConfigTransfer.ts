import {
  buildUserConfigExport,
  parseUserConfigImport,
  type UserConfigPreferencesBlock,
  type UserConfigTheme,
} from '@pixuli/core/user-config';
import { exportJsonFile } from '@/features/settings/exportJsonFile';
import { useSourceStore } from '@/features/settings/sourceStore';
import { syncSourceEntryToImageStore } from '@/features/settings/syncSourceRepoToImageStore';
import { useThemeStore } from '@/features/theme/themeStore';
import { isThemePreference } from '@/features/theme/theme';
import i18n from '@/i18n';

const USER_CONFIG_FILENAME = 'pixuli-user-config.json';

const SUPPORTED_LANGUAGES = new Set(['zh-CN', 'en-US']);

function normalizeLanguage(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (SUPPORTED_LANGUAGES.has(raw)) return raw;
  if (raw.startsWith('zh')) return 'zh-CN';
  if (raw.startsWith('en')) return 'en-US';
  return undefined;
}

function readPreferences(): UserConfigPreferencesBlock {
  const language = normalizeLanguage(i18n.language);
  const theme = useThemeStore.getState().preference;
  const out: UserConfigPreferencesBlock = {};
  if (language) out.language = language;
  if (isThemePreference(theme)) out.theme = theme;
  return out;
}

function applyPreferences(prefs: UserConfigPreferencesBlock): void {
  const language = normalizeLanguage(prefs.language);
  if (language && language !== i18n.language) {
    void i18n.changeLanguage(language);
  }
  if (prefs.theme && isThemePreference(prefs.theme)) {
    useThemeStore.getState().setPreference(prefs.theme as UserConfigTheme);
  }
}

function applySources(params: {
  items: ReturnType<typeof useSourceStore.getState>['sources'];
  selectedSourceId: string | null;
}): void {
  useSourceStore
    .getState()
    .replaceSources(params.items, params.selectedSourceId);
  const selectedId = useSourceStore.getState().selectedSourceId;
  const selected = selectedId
    ? useSourceStore.getState().getSourceById(selectedId)
    : undefined;
  if (selected) {
    syncSourceEntryToImageStore(selected);
  }
}

export type UserConfigExportScope = {
  preferences?: boolean;
  sources?: boolean;
};

export async function exportUserConfig(
  scope: UserConfigExportScope,
): Promise<'file' | 'clipboard' | 'empty'> {
  const includePreferences = Boolean(scope.preferences);
  const includeSources = Boolean(scope.sources);

  if (!includePreferences && !includeSources) {
    return 'empty';
  }

  const { sources, selectedSourceId } = useSourceStore.getState();
  if (includeSources && sources.length === 0 && !includePreferences) {
    return 'empty';
  }

  const preferences = includePreferences ? readPreferences() : undefined;
  const preferencesBlock =
    preferences && (preferences.language || preferences.theme)
      ? preferences
      : undefined;

  if (includePreferences && !preferencesBlock && !includeSources) {
    return 'empty';
  }

  const payload = buildUserConfigExport({
    preferences: preferencesBlock,
    sources:
      includeSources && sources.length > 0
        ? { items: sources, selectedSourceId }
        : undefined,
  });

  if (!payload.blocks.preferences && !payload.blocks.sources) {
    return 'empty';
  }

  return exportJsonFile(USER_CONFIG_FILENAME, JSON.stringify(payload, null, 2));
}

export type UserConfigImportResult = {
  appliedPreferences: boolean;
  appliedSources: boolean;
  sourceCount: number;
  skippedBlocks: string[];
};

export type UserConfigImportScope = {
  /** 文件含 preferences 时是否应用 */
  preferences?: boolean;
  /** 文件含 sources 时是否应用（覆盖本机远端列表） */
  sources?: boolean;
};

export function importUserConfigText(
  text: string,
  scope: UserConfigImportScope = { preferences: true, sources: true },
): UserConfigImportResult | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }

  const parsed = parseUserConfigImport(data);
  if (!parsed) return null;

  const wantPreferences = scope.preferences !== false;
  const wantSources = scope.sources !== false;

  let appliedPreferences = false;
  let appliedSources = false;
  let sourceCount = 0;

  if (wantPreferences && parsed.preferences) {
    applyPreferences(parsed.preferences);
    appliedPreferences = true;
  }

  if (wantSources && parsed.sources) {
    applySources(parsed.sources);
    appliedSources = true;
    sourceCount = parsed.sources.items.length;
  }

  if (!appliedPreferences && !appliedSources) {
    // 只有 skipped 未知块、或范围未命中任何块
    if (parsed.skippedBlocks.length > 0) {
      return {
        appliedPreferences: false,
        appliedSources: false,
        sourceCount: 0,
        skippedBlocks: parsed.skippedBlocks,
      };
    }
    return null;
  }

  return {
    appliedPreferences,
    appliedSources,
    sourceCount,
    skippedBlocks: parsed.skippedBlocks,
  };
}

/** 同步入口：只导出远端连接块。 */
export async function exportSettingsConfig(): Promise<
  'file' | 'clipboard' | 'empty'
> {
  return exportUserConfig({ sources: true });
}

/** 同步入口：只导入远端连接块。 */
export function importSettingsConfigText(
  text: string,
): { count: number } | null {
  const result = importUserConfigText(text, {
    preferences: false,
    sources: true,
  });
  if (!result?.appliedSources) return null;
  return { count: result.sourceCount };
}
