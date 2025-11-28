/// <reference types="vite/client" />

declare module 'vite/client' {
  interface ImportMetaEnv {
    readonly DEV: boolean;
    readonly VITE_USE_GITEE_PROXY?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// 扩展全局 ImportMeta 接口
interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly VITE_USE_GITEE_PROXY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
