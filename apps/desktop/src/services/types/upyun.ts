// Upyun 库的类型声明
export interface UpyunService {
  bucket: string;
  operator: string;
  password: string;
}

export interface UpyunClient {
  putFile(path: string, buffer: Buffer): Promise<boolean | any>;
  deleteFile(path: string): Promise<boolean>;
  listDir(path: string, options?: any): Promise<any>;
  usage(path?: string): Promise<number>;
}

import { UpyunConfig } from '@packages/ui/src';

// Upyun API 参数类型
export interface UpyunUploadParams {
  config: UpyunConfig;
  fileName: string;
  content: string; // base64 content
  description?: string;
  tags?: string[];
}

export interface UpyunDeleteParams {
  config: UpyunConfig;
  fileName: string;
}

export interface UpyunGetListParams {
  config: UpyunConfig;
}

// Upyun API 响应类型
export interface UpyunUploadResponse {
  success: boolean;
  url?: string;
  path?: string;
  result?: any;
  error?: string;
}

export interface UpyunDeleteResponse {
  success: boolean;
  error?: string;
}

export interface UpyunGetListResponse {
  success: boolean;
  files?: Array<{
    name: string;
    size: number;
    time: number;
    url: string;
  }>;
  error?: string;
}

export interface UpyunTestResponse {
  success: boolean;
  usage?: number;
  error?: string;
}

// Upyun API 类型定义
export interface UpyunAPI {
  upyunUpload: (params: UpyunUploadParams) => Promise<UpyunUploadResponse>;
  upyunDelete: (params: UpyunDeleteParams) => Promise<UpyunDeleteResponse>;
  upyunGetList: (params: UpyunGetListParams) => Promise<UpyunGetListResponse>;
  upyunTest: (config: UpyunConfig) => Promise<UpyunTestResponse>;
}

// 全局类型声明
declare global {
  interface Window {
    upyunAPI: UpyunAPI;
  }
}
