export interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  path: string;
}

// GitHub API 相关类型
export interface GitHubUploadParams {
  owner: string;
  repo: string;
  path: string;
  branch: string;
  fileName: string;
  content: string;
  description?: string;
  tags?: string[];
}

export interface GitHubUploadResponse {
  sha: string;
  downloadUrl: string;
  htmlUrl: string;
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
