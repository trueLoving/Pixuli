import '@pixuli/core/plugins';

declare module '@pixuli/core/plugins' {
  interface ProviderContext {
    /** 桌面打包版本地代理根（如 http://127.0.0.1:39281） */
    giteeProxyBase?: string;
  }
}

export {};
