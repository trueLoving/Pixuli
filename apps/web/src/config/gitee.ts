import type { GiteeConfig } from '@packages/common/src';

// 默认 Gitee 配置
export const DEFAULT_GITEE_CONFIG: Partial<GiteeConfig> = {
  branch: 'master',
  path: 'images',
};

// 从本地存储加载配置
export const loadGiteeConfig = (): GiteeConfig | null => {
  try {
    const config = localStorage.getItem('pixuli_gitee_config');
    return config ? JSON.parse(config) : null;
  } catch (error) {
    console.error('Failed to load Gitee config:', error);
    return null;
  }
};

// 保存配置到本地存储
export const saveGiteeConfig = (config: GiteeConfig): void => {
  try {
    localStorage.setItem('pixuli_gitee_config', JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save Gitee config:', error);
  }
};

// 清除本地配置
export const clearGiteeConfig = (): void => {
  try {
    localStorage.removeItem('pixuli_gitee_config');
  } catch (error) {
    console.error('Failed to clear Gitee config:', error);
  }
};
