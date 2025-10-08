import type { GitHubConfig } from '@/types/image'

const GITHUB_CONFIG_KEY = 'pixuli-github-config'

export const loadGitHubConfig = (): GitHubConfig | null => {
  try {
    const config = localStorage.getItem(GITHUB_CONFIG_KEY)
    return config ? JSON.parse(config) : null
  } catch (error) {
    console.error('Failed to load GitHub config:', error)
    return null
  }
}

export const saveGitHubConfig = (config: GitHubConfig): void => {
  try {
    localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('Failed to save GitHub config:', error)
  }
}

export const clearGitHubConfig = (): void => {
  try {
    localStorage.removeItem(GITHUB_CONFIG_KEY)
  } catch (error) {
    console.error('Failed to clear GitHub config:', error)
  }
}
