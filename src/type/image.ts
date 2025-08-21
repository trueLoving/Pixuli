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