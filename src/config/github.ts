import { GitHubConfig } from '@/type/image'

// 默认 GitHub 配置
export const DEFAULT_GITHUB_CONFIG: Partial<GitHubConfig> = {
  branch: 'main',
  path: 'images'
}

// 从本地存储加载配置
export const loadGitHubConfig = (): GitHubConfig | null => {
  try {
    const config = localStorage.getItem('pixuli_github_config')
    return config ? JSON.parse(config) : null
  } catch (error) {
    console.error('Failed to load GitHub config:', error)
    return null
  }
}

// 保存配置到本地存储
export const saveGitHubConfig = (config: GitHubConfig): void => {
  try {
    localStorage.setItem('pixuli_github_config', JSON.stringify(config))
  } catch (error) {
    console.error('Failed to save GitHub config:', error)
  }
}

// 清除本地配置
export const clearGitHubConfig = (): void => {
  try {
    localStorage.removeItem('pixuli_github_config')
  } catch (error) {
    console.error('Failed to clear GitHub config:', error)
  }
} 