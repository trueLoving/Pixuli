// Demo 组件公共工具函数

import type { DemoConfig } from './types';

/**
 * 从环境变量对象创建 GitHub 演示配置
 * @param env 环境变量对象
 * @param platform 平台类型 ('web' | 'mobile')
 */
export function createDemoGitHubConfig(
  env: Record<string, string | undefined>,
  platform: 'web' | 'mobile' = 'web',
): DemoConfig {
  return {
    version: '1.0',
    platform,
    timestamp: new Date().toISOString(),
    config: {
      owner: env.VITE_DEMO_GITHUB_OWNER || '',
      repo: env.VITE_DEMO_GITHUB_REPO || '',
      branch: env.VITE_DEMO_GITHUB_BRANCH || 'main',
      token: env.VITE_DEMO_GITHUB_TOKEN || '',
      path: env.VITE_DEMO_GITHUB_PATH || '',
    },
  };
}

/**
 * 从环境变量对象创建 Gitee 演示配置
 * @param env 环境变量对象
 * @param platform 平台类型 ('web' | 'mobile')
 */
export function createDemoGiteeConfig(
  env: Record<string, string | undefined>,
  platform: 'web' | 'mobile' = 'web',
): DemoConfig {
  return {
    version: '1.0',
    platform,
    timestamp: new Date().toISOString(),
    config: {
      owner: env.VITE_DEMO_GITEE_OWNER || '',
      repo: env.VITE_DEMO_GITEE_REPO || '',
      branch: env.VITE_DEMO_GITEE_BRANCH || 'master',
      token: env.VITE_DEMO_GITEE_TOKEN || '',
      path: env.VITE_DEMO_GITEE_PATH || '',
    },
  };
}

/**
 * 检查环境变量是否已配置
 * @param env 环境变量对象
 */
export function checkEnvConfigured(
  env: Record<string, string | undefined>,
): boolean {
  return !!(
    env.VITE_DEMO_MODE &&
    env.VITE_DEMO_GITHUB_OWNER &&
    env.VITE_DEMO_GITHUB_REPO &&
    env.VITE_DEMO_GITHUB_TOKEN
  );
}

/**
 * 验证 DemoConfig 格式
 * @param config 配置对象
 */
export function validateDemoConfig(config: any): config is DemoConfig {
  return (
    config &&
    typeof config === 'object' &&
    config.config &&
    typeof config.config.owner === 'string' &&
    typeof config.config.repo === 'string'
  );
}
