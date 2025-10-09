// Web API 类型定义
export interface GitHubAPI {
  upload: (params: GitHubUploadParams) => Promise<GitHubUploadResponse>
  delete: (params: GitHubDeleteParams) => Promise<void>
  getList: (params: GitHubGetListParams) => Promise<any[]>
  updateMetadata: (params: GitHubUpdateMetadataParams) => Promise<void>
  setAuth: (token: string) => Promise<{ success: boolean; error?: string }>
}

// GitHub API 参数类型
export interface GitHubUploadParams {
  owner: string
  repo: string
  path: string
  branch: string
  fileName: string
  content: string
  description?: string
  tags?: string[]
}

export interface GitHubUploadResponse {
  sha: string
  downloadUrl: string
  htmlUrl: string
}

export interface GitHubDeleteParams {
  owner: string
  repo: string
  path: string
  branch: string
  fileName: string
}

export interface GitHubGetListParams {
  owner: string
  repo: string
  path: string
  branch: string
}

export interface GitHubUpdateMetadataParams {
  owner: string
  repo: string
  path: string
  branch: string
  fileName: string
  metadata: any
  oldFileName?: string
}

// 全局类型声明
declare global {
  interface Window {
    githubAPI: GitHubAPI
  }
}

export {}
