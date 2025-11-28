// 版本信息类型定义
export interface VersionInfo {
  version: string;
  name: string;
  description: string;
  buildTime: string;
  buildTimestamp: number;
  frameworks: {
    react: string;
    'react-dom': string;
    vite: string;
    typescript: string;
    tailwindcss: string;
    electron?: string;
  };
  dependencies: {
    'lucide-react': string;
    'react-i18next': string;
    zustand: string;
    octokit?: string;
    'pixuli-wasm'?: string;
    'react-dropzone': string;
    'react-hot-toast': string;
    'react-image-crop'?: string;
    [key: string]: string | undefined;
  };
  environment?: {
    node: string;
    platform: string;
    arch: string;
  };
  git: {
    commit: string;
    branch: string;
  };
}
