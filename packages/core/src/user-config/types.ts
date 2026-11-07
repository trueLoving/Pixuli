import type { StoredSourceEntry } from '../plugins/types';

export const USER_CONFIG_KIND = 'pixuli-user-config' as const;
export const USER_CONFIG_SCHEMA_VERSION = 1 as const;

export type UserConfigTheme = 'system' | 'light' | 'dark';

export interface UserConfigPreferencesBlock {
  language?: string;
  theme?: UserConfigTheme;
}

export interface UserConfigSourcesBlock {
  selectedSourceId: string | null;
  items: StoredSourceEntry[];
}

/** 已知块；未知键在解析时进入 skippedBlocks。 */
export interface UserConfigBlocks {
  preferences?: UserConfigPreferencesBlock;
  sources?: UserConfigSourcesBlock;
}

export interface UserConfigPayload {
  kind: typeof USER_CONFIG_KIND;
  schemaVersion: typeof USER_CONFIG_SCHEMA_VERSION;
  exportedAt: string;
  blocks: UserConfigBlocks;
}

export type UserConfigBlockId = keyof UserConfigBlocks;

export interface BuildUserConfigParams {
  preferences?: UserConfigPreferencesBlock;
  sources?: {
    items: StoredSourceEntry[];
    selectedSourceId: string | null;
  };
}

export interface ParsedUserConfig {
  schemaVersion: number;
  preferences: UserConfigPreferencesBlock | null;
  sources: {
    items: StoredSourceEntry[];
    selectedSourceId: string | null;
  } | null;
  /** 文件中存在但本版本未识别的块名 */
  skippedBlocks: string[];
}
