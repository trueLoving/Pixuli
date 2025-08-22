interface VersionInfo {
  update: boolean
  version: string
  newVersion?: string
}

interface ErrorType {
  message: string
  error: Error
}

// GitHub API 相关类型
interface GitHubUploadParams {
  owner: string
  repo: string
  path: string
  branch: string
  fileName: string
  content: string
  description?: string
  tags?: string[]
}

interface GitHubUploadResponse {
  sha: string
  downloadUrl: string
  htmlUrl: string
}

interface GitHubDeleteParams {
  owner: string
  repo: string
  path: string
  branch: string
  fileName: string
}

interface GitHubGetListParams {
  owner: string
  repo: string
  path: string
  branch: string
}

interface GitHubUpdateMetadataParams {
  owner: string
  repo: string
  path: string
  branch: string
  fileName: string
  metadata: any
}

// 扩展 Window 接口
interface Window {
  electronAPI: {
    githubUpload: (params: GitHubUploadParams) => Promise<GitHubUploadResponse>
    githubDelete: (params: GitHubDeleteParams) => Promise<void>
    githubGetList: (params: GitHubGetListParams) => Promise<any[]>
    githubUpdateMetadata: (params: GitHubUpdateMetadataParams) => Promise<void>
    githubSetAuth: (token: string) => Promise<{ success: boolean; error?: string }>
  }
}
