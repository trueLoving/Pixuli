import { GiteeConfig } from '@packages/ui/src';

const GITEE_CONFIG_KEY = 'pixuli-gitee-config';

// 默认 Gitee 配置
export const DEFAULT_GITEE_CONFIG: Partial<GiteeConfig> = {
  branch: 'main',
  path: 'images',
};

// 从本地存储加载配置
export const loadGiteeConfig = (): GiteeConfig | null => {
  try {
    const config = localStorage.getItem(GITEE_CONFIG_KEY);
    return config ? JSON.parse(config) : null;
  } catch (error) {
    console.error('Failed to load Gitee config:', error);
    return null;
  }
};

// 保存配置到本地存储
export const saveGiteeConfig = (config: GiteeConfig): void => {
  try {
    localStorage.setItem(GITEE_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save Gitee config:', error);
  }
};

// 清除本地配置
export const clearGiteeConfig = (): void => {
  try {
    localStorage.removeItem(GITEE_CONFIG_KEY);
  } catch (error) {
    console.error('Failed to clear Gitee config:', error);
  }
};
