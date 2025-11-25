import { GitHubConfig } from 'pixuli-common/src';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GITHUB_CONFIG_KEY = 'pixuli-github-config';

// 默认 GitHub 配置
export const DEFAULT_GITHUB_CONFIG: Partial<GitHubConfig> = {
  branch: 'main',
  path: 'images',
};

// 从本地存储加载配置
export const loadGitHubConfig = async (): Promise<GitHubConfig | null> => {
  try {
    const config = await AsyncStorage.getItem(GITHUB_CONFIG_KEY);
    return config ? JSON.parse(config) : null;
  } catch (error) {
    console.error('Failed to load GitHub config:', error);
    return null;
  }
};

// 保存配置到本地存储
export const saveGitHubConfig = async (config: GitHubConfig): Promise<void> => {
  try {
    await AsyncStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save GitHub config:', error);
  }
};

// 清除本地配置
export const clearGitHubConfig = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(GITHUB_CONFIG_KEY);
  } catch (error) {
    console.error('Failed to clear GitHub config:', error);
  }
};
