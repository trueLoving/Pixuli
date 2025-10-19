export interface ImageItem {
  id: string
  name: string
  url: string
  githubUrl: string
  size: number
  width: number
  height: number
  type: string
  tags: string[]
  description?: string
  createdAt: string
  updatedAt: string
}

export interface ImageUploadData {
  file: File
  name?: string
  description?: string
  tags?: string[]
}

export interface ImageEditData {
  id: string
  name?: string
  description?: string
  tags?: string[]
}

export interface UpyunConfig {
  operator: string
  password: string
  bucket: string
  domain: string
  path: string
}

export interface GitHubConfig {
  owner: string
  repo: string
  branch: string
  token: string
  path: string
}

export interface UploadProgress {
  id: string
  progress: number
  status: 'uploading' | 'success' | 'error'
  message?: string
}

export interface MultiImageUploadData {
  files: File[]
  name?: string
  description?: string
  tags?: string[]
}

export interface BatchUploadProgress {
  total: number
  completed: number
  failed: number
  current?: string
  items: UploadProgress[]
}

// GitHub API 相关类型
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

// 应用更新相关类型
export interface VersionInfo {
  update: boolean
  version: string
  newVersion?: string
}

export interface ErrorType {
  message: string
  error: Error
}
