// GitHub API 参数类型
export interface GitHubUploadParams {
  owner: string;
  repo: string;
  path: string;
  branch: string;
  fileName: string;
  content: string; // base64 content
  description?: string;
  tags?: string[];
}

export interface GitHubDeleteParams {
  owner: string;
  repo: string;
  path: string;
  branch: string;
  fileName: string;
}

export interface GitHubGetListParams {
  owner: string;
  repo: string;
  path: string;
  branch: string;
}

export interface GitHubUpdateMetadataParams {
  owner: string;
  repo: string;
  path: string;
  branch: string;
  fileName: string;
  metadata: any;
  oldFileName?: string;
}

// GitHub API 响应类型
export interface GitHubUploadResponse {
  sha?: string;
  downloadUrl?: string;
  htmlUrl?: string;
}

export interface GitHubDeleteResponse {
  success: boolean;
  error?: string;
}

export interface GitHubGetListResponse {
  success: boolean;
  files?: Array<{
    sha: string;
    name: string;
    downloadUrl: string;
    htmlUrl: string;
    size: number;
    width: number;
    height: number;
    tags: string[];
    description: string;
    createdAt: string;
    updatedAt: string;
  }>;
  error?: string;
}

export interface GitHubUpdateMetadataResponse {
  success: boolean;
  error?: string;
}

// Github API 类型定义
export interface GitHubAPI {
  githubUpload: (params: GitHubUploadParams) => Promise<GitHubUploadResponse>;
  githubDelete: (params: GitHubDeleteParams) => Promise<void>;
  githubGetList: (params: GitHubGetListParams) => Promise<any[]>;
  githubUpdateMetadata: (params: GitHubUpdateMetadataParams) => Promise<void>;
  githubSetAuth: (
    token: string
  ) => Promise<{ success: boolean; error?: string }>;
}

// 全局类型声明
declare global {
  interface Window {
    githubAPI: GitHubAPI;
  }
}
