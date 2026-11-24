import type { StorageProviderConfig } from '@pixuli/core/plugins';
import { loadGiteeConfig } from './gitee';
import { loadGitHubConfig } from './github';
import { clearGiteeConfig } from './gitee';
import { clearGitHubConfig } from './github';

const SESSION_KEY = 'pixuli-storage-session.v1';

export type ActiveStorageSession = {
  pluginId: string;
  config: StorageProviderConfig;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidSession(value: unknown): value is ActiveStorageSession {
  if (!isRecord(value)) return false;
  if (typeof value.pluginId !== 'string' || !value.pluginId.trim())
    return false;
  return isRecord(value.config);
}

/** 读取当前激活存储会话；兼容旧 github/gitee 分 key */
export function loadActiveStorageSession(): ActiveStorageSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (isValidSession(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }

  const gitee = loadGiteeConfig();
  if (gitee) {
    return { pluginId: 'gitee', config: { ...gitee } };
  }
  const github = loadGitHubConfig();
  if (github) {
    return { pluginId: 'github', config: { ...github } };
  }
  return null;
}

export function saveActiveStorageSession(session: ActiveStorageSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save storage session:', error);
  }
  // 写新格式后清旧分轨，避免下次启动歧义
  clearGitHubConfig();
  clearGiteeConfig();
}

export function clearActiveStorageSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear storage session:', error);
  }
  clearGitHubConfig();
  clearGiteeConfig();
}
