/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Capacitor 真机包：已部署 Web 站点根 URL，供 Gitee 图片代理（无 /api 路由时） */
  readonly VITE_GITEE_PROXY_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
/// <reference path="./types/service-worker.d.ts" />

declare module 'virtual:pwa-register/react' {
  import type { Dispatch, SetStateAction } from 'react';

  export interface RegisterSWOptions {
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: Error) => void;
  }

  export function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: boolean;
    offlineReady: boolean;
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
    setNeedRefresh: Dispatch<SetStateAction<boolean>>;
    setOfflineReady: Dispatch<SetStateAction<boolean>>;
  };
}
