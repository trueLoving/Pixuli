export interface GiteeConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  path: string;
}

// Gitee API 相关类型
export interface GiteeUploadParams {
  owner: string;
  repo: string;
  path: string;
  branch: string;
  fileName: string;
  content: string;
  description?: string;
  tags?: string[];
}

export interface GiteeUploadResponse {
  sha: string;
  downloadUrl: string;
  htmlUrl: string;
}

export interface GiteeDeleteParams {
  owner: string;
  repo: string;
  path: string;
  branch: string;
  fileName: string;
}

export interface GiteeGetListParams {
  owner: string;
  repo: string;
  path: string;
  branch: string;
}

export interface GiteeUpdateMetadataParams {
  owner: string;
  repo: string;
  path: string;
  branch: string;
  fileName: string;
  metadata: any;
  oldFileName?: string;
}
