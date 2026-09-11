export interface GiteeConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  /** 远端仓库挂载点（configRoot）；空字符串表示镜像到仓库根下 */
  path: string;
  /** 连接时从仓库列表写入；复制链接私有仓附注用 */
  private?: boolean;
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
