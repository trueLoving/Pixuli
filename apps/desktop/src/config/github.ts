import { GitHubConfig } from '@packages/ui/src';

const GITHUB_CONFIG_KEY = 'pixuli-github-config';

// 默认 GitHub 配置
export const DEFAULT_GITHUB_CONFIG: Partial<GitHubConfig> = {
  branch: 'main',
  path: 'images',
};

// 从本地存储加载配置
export const loadGitHubConfig = (): GitHubConfig | null => {
  try {
    const config = localStorage.getItem(GITHUB_CONFIG_KEY);
    return config ? JSON.parse(config) : null;
  } catch (error) {
    console.error('Failed to load GitHub config:', error);
    return null;
  }
};

// 保存配置到本地存储
export const saveGitHubConfig = (config: GitHubConfig): void => {
  try {
    localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save GitHub config:', error);
  }
};

// 清除本地配置
export const clearGitHubConfig = (): void => {
  try {
    localStorage.removeItem(GITHUB_CONFIG_KEY);
  } catch (error) {
    console.error('Failed to clear GitHub config:', error);
  }
};
