/// <reference types="vite/client" />

/**
 * 全局类型声明
 * 用于支持跨平台代码中的 Node.js 和 React Native API
 */

// 声明 require 函数（用于 CommonJS 模块和 React Native）
declare const require: {
  (id: string): any;
  cache: any;
  extensions: any;
  main: any;
  resolve(id: string): string;
} | undefined;

// 扩展 Window 接口以支持 Electron
interface Window {
  process?: {
    type?: string;
    [key: string]: any;
  };
}

declare module 'vite/client' {
  interface ImportMetaEnv {
    readonly DEV: boolean;
    readonly VITE_USE_GITEE_PROXY?: string;
    // Demo 模式配置
    readonly VITE_DEMO_MODE?: string;
    readonly VITE_DEMO_GITHUB_OWNER?: string;
    readonly VITE_DEMO_GITHUB_REPO?: string;
    readonly VITE_DEMO_GITHUB_BRANCH?: string;
    readonly VITE_DEMO_GITHUB_TOKEN?: string;
    readonly VITE_DEMO_GITHUB_PATH?: string;
    readonly VITE_DEMO_GITEE_OWNER?: string;
    readonly VITE_DEMO_GITEE_REPO?: string;
    readonly VITE_DEMO_GITEE_BRANCH?: string;
    readonly VITE_DEMO_GITEE_TOKEN?: string;
    readonly VITE_DEMO_GITEE_PATH?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// 扩展全局 ImportMeta 接口
interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly VITE_USE_GITEE_PROXY?: string;
  // Demo 模式配置
  readonly VITE_DEMO_MODE?: string;
  readonly VITE_DEMO_GITHUB_OWNER?: string;
  readonly VITE_DEMO_GITHUB_REPO?: string;
  readonly VITE_DEMO_GITHUB_BRANCH?: string;
  readonly VITE_DEMO_GITHUB_TOKEN?: string;
  readonly VITE_DEMO_GITHUB_PATH?: string;
  readonly VITE_DEMO_GITEE_OWNER?: string;
  readonly VITE_DEMO_GITEE_REPO?: string;
  readonly VITE_DEMO_GITEE_BRANCH?: string;
  readonly VITE_DEMO_GITEE_TOKEN?: string;
  readonly VITE_DEMO_GITEE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
