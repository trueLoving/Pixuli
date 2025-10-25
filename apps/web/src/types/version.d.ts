// 版本信息类型定义
export interface VersionInfo {
  version: string;
  name: string;
  description: string;
  buildTime: string;
  buildTimestamp: number;
  frameworks: {
    react: string;
    vite: string;
    typescript: string;
    tailwindcss: string;
  };
  dependencies: {
    'lucide-react': string;
    'react-i18next': string;
    zustand: string;
    octokit: string;
  };
  environment: {
    node: string;
    platform: string;
    arch: string;
  };
  git: {
    commit: string;
    branch: string;
  };
}

// 全局变量声明
declare global {
  const __VERSION_INFO__: VersionInfo;
}

export {};
